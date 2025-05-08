/* Copyright © 2025 Apeleg Limited. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License") with LLVM
 * exceptions; you may not use this file except in compliance with the
 * License. You may obtain a copy of the License at
 *
 * http://llvm.org/foundation/relicensing/LICENSE.txt
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import crc32 from './crc32.js';
import sharedBufferToUint8Array from './sharedBufferToUint8Array.js';

const toU64 = (lo: number, hi: number) =>
	(lo >>> 0) + (hi >>> 0) * ((-1 >>> 0) + 1);
const u8 = (dv: DataView, offset: number) => dv.getUint8(offset);
const u16 = (dv: DataView, offset: number) => dv.getUint16(offset, true);
const u32 = (dv: DataView, offset: number) => dv.getUint32(offset, true);
const u64 = (dv: DataView, offset: number) =>
	toU64(u32(dv, offset), u32(dv, offset + 4));

const assertEq = <T>(actual: T, expected: T): void => {
	if (actual !== expected) {
		throw new Error('assertEq failed');
	}
};

const processEndCentralHeader = (
	dv: DataView,
	echPos: number,
	isZip64: boolean,
): [
	diskNumber: number,
	centralDiskNumber: number,
	localEntries: number,
	totalEntries: number,
	sizeCentralDir: number,
	offsetToCentralDir: number,
] => {
	if (isZip64) {
		const central64DiskNumber = u32(dv, echPos - 20 + 4);
		const offsetToCentralDir64 = u64(dv, echPos - 20 + 8);
		const totalNoOfDisks = u32(dv, echPos - 20 + 16);

		assertEq(central64DiskNumber, 0);
		assertEq(totalNoOfDisks, 1);

		if (offsetToCentralDir64 > echPos - 76) {
			throw new RangeError('Overlapping ZIP64 header');
		}

		const zip64Header = u32(dv, offsetToCentralDir64);
		if (zip64Header !== 0x06064b50) {
			throw new Error('Expected ZIP64 header');
		}

		const zip64Size = u64(dv, offsetToCentralDir64 + 4);
		if (offsetToCentralDir64 + zip64Size > echPos - 32) {
			throw new RangeError('Overlapping sections');
		}

		const sizeCentralDir = u64(dv, offsetToCentralDir64 + 40);
		const offsetToCentralDir = u64(dv, offsetToCentralDir64 + 48);

		if (offsetToCentralDir + sizeCentralDir > offsetToCentralDir64) {
			throw new RangeError('Overlapping sections');
		}

		const versionNeeded = u8(dv, offsetToCentralDir64 + 14);
		const diskNumber = u32(dv, offsetToCentralDir64 + 16);
		const centralDiskNumber = u32(dv, offsetToCentralDir64 + 20);
		const localEntries = u64(dv, offsetToCentralDir64 + 24);
		const totalEntries = u64(dv, offsetToCentralDir64 + 32);

		if (versionNeeded > 45) {
			throw new RangeError('Unsupported version');
		}

		return [
			diskNumber,
			centralDiskNumber,
			localEntries,
			totalEntries,
			sizeCentralDir,
			offsetToCentralDir,
		];
	} else {
		const sizeCentralDir = u32(dv, echPos + 12);
		const offsetToCentralDir = u32(dv, echPos + 16);

		if (offsetToCentralDir + sizeCentralDir > echPos) {
			throw new RangeError('Overlapping sections');
		}

		const diskNumber = u16(dv, echPos + 4);
		const centralDiskNumber = u16(dv, echPos + 6);
		const localEntries = u16(dv, echPos + 8);
		const totalEntries = u16(dv, echPos + 10);

		return [
			diskNumber,
			centralDiskNumber,
			localEntries,
			totalEntries,
			sizeCentralDir,
			offsetToCentralDir,
		];
	}
};

const processExtraZip64 = (
	dv: DataView,
	offsetToExtra: number,
	extraLength: number,
): [
	uncompressedLength: number | undefined,
	compressedLength: number | undefined,
	offsetToLocalHeader: number | undefined,
	diskStartNumber: number | undefined,
] => {
	const max = offsetToExtra + extraLength;
	let offset = offsetToExtra;
	while (offset <= max - 4) {
		if (u16(dv, offset) === 0x0001) break;
		const size = u16(dv, offset + 2);
		offset += 4 + size;
	}
	if (offset > max - 4) {
		throw new RangeError('Overlapping sections');
	}
	const size = u16(dv, offset + 2);
	if (
		offset + size + 4 > max ||
		(size <= 0o30 && !!(size & 0o07)) ||
		(size > 0o30 && size !== 0o34)
	) {
		throw new Error('Invalid ZIP64 extra');
	}

	let uncompressedLength: number | undefined,
		compressedLength: number | undefined,
		offsetToLocalHeader: number | undefined,
		diskStartNumber: number | undefined;

	if (size >= 0o10) {
		uncompressedLength = u64(dv, offset + 4);
	}
	if (size >= 0o20) {
		compressedLength = u64(dv, offset + 4 + 0o10);
	}
	if (size >= 0o30) {
		offsetToLocalHeader = u64(dv, offset + 4 + 0o20);
	}
	if (size >= 0o34) {
		offsetToLocalHeader = u32(dv, offset + 4 + 0o30);
	}

	return [
		uncompressedLength,
		compressedLength,
		offsetToLocalHeader,
		diskStartNumber,
	];
};

const processCentralDir = (
	dv: DataView,
	offsetToCentralDir: number,
	isZip64: boolean,
): [
	flags: number,
	compressionMethod: number,
	crc: number,
	compressedLength: number,
	uncompressedLength: number,
	filenameLength: number,
	diskStartNumber: number,
	offsetToLocalHeader: number,
] => {
	assertEq(u32(dv, offsetToCentralDir), 0x02014b50);
	if (u8(dv, offsetToCentralDir + 6) > 45) {
		throw new RangeError('Unsupported version');
	}
	const flags = u16(dv, offsetToCentralDir + 8);
	const compressionMethod = u16(dv, offsetToCentralDir + 10);
	const crc = u32(dv, offsetToCentralDir + 16);
	let compressedLength = u32(dv, offsetToCentralDir + 20);
	let uncompressedLength = u32(dv, offsetToCentralDir + 24);
	const filenameLength = u16(dv, offsetToCentralDir + 28);
	const extraLength = u16(dv, offsetToCentralDir + 30);
	let diskStartNumber = u16(dv, offsetToCentralDir + 34);
	let offsetToLocalHeader = u32(dv, offsetToCentralDir + 42);

	if (extraLength && isZip64) {
		const [
			uncompressedLength64,
			compressedLength64,
			offsetToLocalHeader64,
			diskStartNumber64,
		] = processExtraZip64(
			dv,
			offsetToCentralDir + 46 + filenameLength,
			extraLength,
		);

		if (uncompressedLength64 != null) {
			uncompressedLength = uncompressedLength64;
		}
		if (compressedLength64 != null) {
			compressedLength = compressedLength64;
		}
		if (offsetToLocalHeader64 != null) {
			offsetToLocalHeader = offsetToLocalHeader64;
		}
		if (diskStartNumber64 != null) {
			diskStartNumber = diskStartNumber64;
		}
	}

	if (
		offsetToLocalHeader + filenameLength + compressedLength >
		offsetToCentralDir - 30
	) {
		throw new RangeError('Overlapping sections');
	}

	return [
		flags,
		compressionMethod,
		crc,
		compressedLength,
		uncompressedLength,
		filenameLength,
		diskStartNumber,
		offsetToLocalHeader,
	];
};

const processLocalHeader = (
	dv: DataView,
	offsetToCentralDir: number,
	offsetToLocalHeader: number,
	isZip64: boolean,
): [
	flags: number,
	compressionMethod: number,
	crc: number,
	compressedLength: number,
	uncompressedLength: number,
	filenameLength: number,
	extraLength: number,
] => {
	assertEq(u32(dv, offsetToLocalHeader), 0x04034b50);
	if (u8(dv, offsetToLocalHeader + 4) > 45) {
		throw new RangeError('Unsupported version');
	}
	const flags = u16(dv, offsetToLocalHeader + 6);
	const compressionMethod = u16(dv, offsetToLocalHeader + 8);
	const crc = u32(dv, offsetToLocalHeader + 14);
	let compressedLength = u32(dv, offsetToLocalHeader + 18);
	let uncompressedLength = u32(dv, offsetToLocalHeader + 22);
	const filenameLength = u16(dv, offsetToLocalHeader + 26);
	const extraLength = u16(dv, offsetToLocalHeader + 28);

	if (extraLength && isZip64) {
		const [
			uncompressedLength64,
			compressedLength64,
			offsetToLocalHeader64,
		] = processExtraZip64(
			dv,
			offsetToLocalHeader + 30 + filenameLength,
			extraLength,
		);

		if (uncompressedLength64 != null) {
			uncompressedLength = uncompressedLength64;
		}
		if (compressedLength64 != null) {
			compressedLength = compressedLength64;
		}
		if (offsetToLocalHeader64 != null) {
			offsetToLocalHeader = offsetToLocalHeader64;
		}
	}

	if (
		offsetToLocalHeader + filenameLength + compressedLength + extraLength >
		offsetToCentralDir - 30
	) {
		throw new RangeError('Overlapping sections');
	}

	return [
		flags,
		compressionMethod,
		crc,
		compressedLength,
		uncompressedLength,
		filenameLength,
		extraLength,
	];
};

const unzip_ = (
	input: AllowSharedBufferSource,
): [filename: string, data: ArrayBufferLike] => {
	if (input.byteLength < 22) {
		throw new RangeError('Insufficient size');
	}

	const buffer = sharedBufferToUint8Array(input);
	const dv = new DataView(
		buffer.buffer,
		buffer.byteOffset,
		buffer.byteLength,
	);
	const minEchPos = Math.max(buffer.length - 19 - (1 << 16), 3);
	let echPos = 0;
	for (let i = buffer.length - 19; i >= minEchPos; i--) {
		if (buffer[i] === 0x06 && u32(dv, i - 3) === 0x06054b50) {
			echPos = i - 3;
			break;
		}
	}

	if (!echPos) {
		throw new Error('End Central Header not found');
	}

	const isZip64 = echPos >= 76 && u32(dv, echPos - 20) === 0x07064b50;

	const [
		diskNumber,
		centralDiskNumber,
		localEntries,
		totalEntries,
		,
		offsetToCentralDir,
	] = processEndCentralHeader(dv, echPos, isZip64);

	assertEq(diskNumber, 0);
	assertEq(centralDiskNumber, 0);
	assertEq(localEntries, 1);
	assertEq(totalEntries, 1);

	const [
		cFlags,
		cCompressionMethod,
		cCrc,
		cCompressedLength,
		cUncompressedLength,
		cFilenameLength,
		cDiskStartNumber,
		cOffsetToLocalHeader,
	] = processCentralDir(dv, offsetToCentralDir, isZip64);

	assertEq(cCompressionMethod, 0);
	assertEq(cCompressedLength, cUncompressedLength);
	assertEq(cDiskStartNumber, 0);

	const filename = new TextDecoder().decode(
		buffer.slice(
			offsetToCentralDir + 46,
			offsetToCentralDir + 46 + cFilenameLength,
		),
	);

	assertEq(u32(dv, cOffsetToLocalHeader), 0x04034b50);

	const [
		lFlags,
		lCompressionMethod,
		lCrc,
		lCompressedLength,
		lUncompressedLength,
		lFilenameLength,
		lExtraLength,
	] = processLocalHeader(
		dv,
		offsetToCentralDir,
		cOffsetToLocalHeader,
		isZip64,
	);

	assertEq(lFlags, cFlags);
	assertEq(lCompressionMethod, cCompressionMethod);
	assertEq(lCrc, cCrc);
	assertEq(lCompressedLength, cCompressedLength);
	assertEq(lUncompressedLength, cUncompressedLength);
	assertEq(lFilenameLength, cFilenameLength);

	const data = buffer.slice(
		cOffsetToLocalHeader + 30 + lFilenameLength + lExtraLength,
		cOffsetToLocalHeader +
			30 +
			lFilenameLength +
			lExtraLength +
			lCompressedLength,
	);

	const computedCrc = crc32(data);
	assertEq(computedCrc, lCrc);

	return [filename, data];
};

export default unzip_;
