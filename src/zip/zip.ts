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
import sharedBufferConcat from './sharedBufferConcat.js';

// higher32Bits extracts the high 32-bit portion of a JavaScript number.
// In JavaScript, numbers are 64-bit floating point values, but the bitwise
// operations treat them as 32-bit integers. For a 64-bit value represented
// in two 32-bit parts, this function calculates the upper 32 bits by:
//   1. Performing n >>> 0, which converts n to an unsigned 32-bit integer.
//   2. Subtracting that from the original n, leaving any high-order bits that
//      didn't fit into the lower 32 bits.
//   3. Dividing by ((-1 >>> 0) + 1) which equals 2^32 (i.e. 0x100000000) to
//      shift those high bits down to a 32-bit value.
// This is useful in contexts like ZIP64 for representing sizes or offsets as
// 64-bit values split into two 32-bit numbers.
const higher32Bits = (n: number) => (n - (n >>> 0)) / ((-1 >>> 0) + 1);
const u8a = (a: number[]) => new Uint8Array(a);

/**
 * Create a ZIP file entry using local and central directory headers.
 *
 * @param name - The filename for the ZIP entry.
 * @param input - The raw file data.
 * @param coerceZip64 - Force use of ZIP64 formatting.
 * @param pad - Pad file size to 256 bytes.
 * @returns The entire ZIP file entry data as a buffer.
 */
const zip_ = (
	name: string,
	input: AllowSharedBufferSource,
	coerceZip64?: boolean | number,
	pad?: boolean,
) => {
	const textEncoder = new TextEncoder();
	const nameBuffer = textEncoder.encode(name);
	const nameLen = nameBuffer.byteLength;

	if (nameLen >= 1 << 16) {
		throw new RangeError('Name is too long');
	}

	const len = input.byteLength;
	// Determine whether ZIP64 should be used. Use ZIP64 if:
	//   - explicitly set via useZip64 parameter, or
	//   - the total size would exceed the 32-bit unsigned integer maximum value
	// 0x1e is the position of the central dir offset without considering data
	// (file name and contents), i.e., the size of the local header.
	const useZip64 = coerceZip64 || !!(len + nameLen + 0x1e > -1 >>> 0);
	const needsZip64Extra =
		coerceZip64 === 2 || (useZip64 && !!(len > -1 >>> 0));

	const crc = crc32(input);

	// Create 'extra' segment data for ZIP64 if needed.
	// If ZIP64 is used, provide extra fields containing the 64-bit sizes.
	const segment2 = needsZip64Extra
		? [
				// Extra ID #0001
				// ZIP64 (0x0001)
				0x01,
				0x00,
				// Length (16 bytes)
				0x10,
				0x00,
				// Uncompressed Size
				(len >>> 0o00) & 0xff,
				(len >>> 0o10) & 0xff,
				(len >>> 0o20) & 0xff,
				(len >>> 0o30) & 0xff,
				(higher32Bits(len) >>> 0o00) & 0xff,
				(higher32Bits(len) >>> 0o10) & 0xff,
				(higher32Bits(len) >>> 0o20) & 0xff,
				(higher32Bits(len) >>> 0o30) & 0xff,
				// Compressed Size
				(len >>> 0o00) & 0xff,
				(len >>> 0o10) & 0xff,
				(len >>> 0o20) & 0xff,
				(len >>> 0o30) & 0xff,
				(higher32Bits(len) >>> 0o00) & 0xff,
				(higher32Bits(len) >>> 0o10) & 0xff,
				(higher32Bits(len) >>> 0o20) & 0xff,
				(higher32Bits(len) >>> 0o30) & 0xff,
			]
		: [];
	// Build the 'local file header' segment
	const segment1 = [
		// LOCAL HEADER #1
		0x50,
		0x4b,
		0x03,
		0x04,
		// Extract Zip Spec (1.0 or 4.5), Extract OS (MS-DOS)
		useZip64 ? 0x2d : 0x0a,
		0x00,
		// General Purpose Flag
		0x00,
		// [GPF] Language encoding flag (EFS)
		0x08,
		// Compression Method (0 = stored / no compression)
		0x00,
		0x00,
		// Last mod time
		0x00,
		0x00,
		0x00,
		0x00,
		// CRC
		(crc >>> 0o00) & 0xff,
		(crc >>> 0o10) & 0xff,
		(crc >>> 0o20) & 0xff,
		(crc >>> 0o30) & 0xff,
		// Compressed Length; if using ZIP64, use 0xff as a placeholder
		needsZip64Extra ? 0xff : (len >>> 0o00) & 0xff,
		needsZip64Extra ? 0xff : (len >>> 0o10) & 0xff,
		needsZip64Extra ? 0xff : (len >>> 0o20) & 0xff,
		needsZip64Extra ? 0xff : (len >>> 0o30) & 0xff,
		// Uncompressed Length; if using ZIP64, use 0xff as a placeholder
		needsZip64Extra ? 0xff : (len >>> 0o00) & 0xff,
		needsZip64Extra ? 0xff : (len >>> 0o10) & 0xff,
		needsZip64Extra ? 0xff : (len >>> 0o20) & 0xff,
		needsZip64Extra ? 0xff : (len >>> 0o30) & 0xff,
		// Filename Length
		(nameLen >>> 0o00) & 0xff,
		(nameLen >>> 0o10) & 0xff,
		// Extra Length
		(segment2.length >>> 0o00) & 0xff,
		(segment2.length >>> 0o10) & 0xff,
	];
	// The Local File Header (segment1) is immediately followed by:
	// - the filename (nameBuffer)
	// - the extra data (segment2)
	// - the file's actual data (input)

	// Build the 'central directory header' segment
	const segment3 = [
		// CENTRAL HEADER #1
		0x50,
		0x4b,
		0x01,
		0x02,
		// Created Zip Spec, Created OS
		// 6.3, which is where EFS is defined
		0x3f,
		0x00,
		// Extract Zip Spec, Extract Zip OS
		useZip64 ? 0x2d : 0x0a,
		0x00,
		// General Purpose Flag
		0x00,
		0x08, // Language encoding flag (EFS)
		// Compression Method
		0x00,
		0x00,
		// Last mod time
		0x00,
		0x00,
		0x00,
		0x00,
		// CRC
		(crc >>> 0o00) & 0xff,
		(crc >>> 0o10) & 0xff,
		(crc >>> 0o20) & 0xff,
		(crc >>> 0o30) & 0xff,
		// Compressed Length
		needsZip64Extra ? 0xff : (len >>> 0o00) & 0xff,
		needsZip64Extra ? 0xff : (len >>> 0o10) & 0xff,
		needsZip64Extra ? 0xff : (len >>> 0o20) & 0xff,
		needsZip64Extra ? 0xff : (len >>> 0o30) & 0xff,
		// Uncompressed Length
		needsZip64Extra ? 0xff : (len >>> 0o00) & 0xff,
		needsZip64Extra ? 0xff : (len >>> 0o10) & 0xff,
		needsZip64Extra ? 0xff : (len >>> 0o20) & 0xff,
		needsZip64Extra ? 0xff : (len >>> 0o30) & 0xff,
		// Filename Length
		(nameBuffer.byteLength >>> 0o00) & 0xff,
		(nameBuffer.byteLength >>> 0o10) & 0xff,
		// Extra Length
		(segment2.length >>> 0o00) & 0xff,
		(segment2.length >>> 0o10) & 0xff,
		// Comment Length
		0x00,
		0x00,
		// Disk Start
		0x00,
		0x00,
		// Int File Attributes
		//   [Bit 0] 'Binary Data'
		0x00,
		0x00,
		// Ext File Attributes
		0x00,
		0x00,
		0x00,
		0x00,
		// Local Header Offset
		0x00,
		0x00,
		0x00,
		0x00,
	];
	// The Central Directory Header is followed by the filename and extra data
	// (same as segment2).

	// Calculate central directory information
	const centralDirLen = segment3.length + nameLen + segment2.length;
	const centralDirOffset = segment1.length + nameLen + segment2.length + len;
	const zip64CentralDirOffset = centralDirLen + centralDirOffset;
	const segment4 = useZip64
		? [
				// ZIP64 END CENTRAL DIR RECORD
				0x50,
				0x4b,
				0x06,
				0x06,
				// Size of record
				0x2c,
				0x00,
				0x00,
				0x00,
				0x00,
				0x00,
				0x00,
				0x00,
				// Created Zip Spec / Created OS
				0x2d,
				0x00,
				// Extract Zip Spec / Extract OS
				0x2d,
				0x00,
				// Number of this disk
				0x00,
				0x00,
				0x00,
				0x00,
				// Central Dir Disk no
				0x00,
				0x00,
				0x00,
				0x00,
				// Entries in this disk
				0x01,
				0x00,
				0x00,
				0x00,
				0x00,
				0x00,
				0x00,
				0x00,
				// Total Entries
				0x01,
				0x00,
				0x00,
				0x00,
				0x00,
				0x00,
				0x00,
				0x00,
				// Size of Central Dir
				(centralDirLen >>> 0o00) & 0xff,
				(centralDirLen >>> 0o10) & 0xff,
				(centralDirLen >>> 0o20) & 0xff,
				(centralDirLen >>> 0o30) & 0xff,
				0x00,
				0x00,
				0x00,
				0x00,
				// Offset to Central dir
				(centralDirOffset >>> 0o00) & 0xff,
				(centralDirOffset >>> 0o10) & 0xff,
				(centralDirOffset >>> 0o20) & 0xff,
				(centralDirOffset >>> 0o30) & 0xff,
				(higher32Bits(centralDirOffset) >>> 0o00) & 0xff,
				(higher32Bits(centralDirOffset) >>> 0o10) & 0xff,
				(higher32Bits(centralDirOffset) >>> 0o20) & 0xff,
				(higher32Bits(centralDirOffset) >>> 0o30) & 0xff,
			]
		: [];

	const segment5 = useZip64
		? [
				// ZIP64 END CENTRAL DIR LOCATOR
				0x50,
				0x4b,
				0x06,
				0x07,
				// Central Dir Disk no
				0x00,
				0x00,
				0x00,
				0x00,
				// Offset to Central dir
				(zip64CentralDirOffset >>> 0o00) & 0xff,
				(zip64CentralDirOffset >>> 0o10) & 0xff,
				(zip64CentralDirOffset >>> 0o20) & 0xff,
				(zip64CentralDirOffset >>> 0o30) & 0xff,
				(higher32Bits(zip64CentralDirOffset) >>> 0o00) & 0xff,
				(higher32Bits(zip64CentralDirOffset) >>> 0o10) & 0xff,
				(higher32Bits(zip64CentralDirOffset) >>> 0o20) & 0xff,
				(higher32Bits(zip64CentralDirOffset) >>> 0o30) & 0xff,
				// Total no of Disks
				0x01,
				0x00,
				0x00,
				0x00,
			]
		: [];

	const totalSize =
		zip64CentralDirOffset +
		segment4.length +
		segment5.length +
		// segment6 length
		22;
	// Pad file to have a size multiple of 256
	const paddingLen = pad !== false ? ((totalSize - 1) & 0xff) ^ 0xff : 0x00;

	// Build the End of Central Directory (EOCD) record
	const segment6 = [
		// END CENTRAL HEADER
		0x50,
		0x4b,
		0x05,
		0x06,
		// Number of this disk
		0x00,
		0x00,
		// Central Dir Disk no
		0x00,
		0x00,
		// Entries in this disk
		0x01,
		0x00,
		// Total Entries
		0x01,
		0x00,
		// Size of Central Dir
		(centralDirLen >>> 0o00) & 0xff,
		(centralDirLen >>> 0o10) & 0xff,
		(centralDirLen >>> 0o20) & 0xff,
		(centralDirLen >>> 0o30) & 0xff,
		// Offset to Central Dir
		useZip64 ? 0xff : (centralDirOffset >>> 0o00) & 0xff,
		useZip64 ? 0xff : (centralDirOffset >>> 0o10) & 0xff,
		useZip64 ? 0xff : (centralDirOffset >>> 0o20) & 0xff,
		useZip64 ? 0xff : (centralDirOffset >>> 0o30) & 0xff,
		// Comment Length
		0x00,
		0x00,
	];

	return sharedBufferConcat(
		u8a(segment1),
		nameBuffer,
		u8a(segment2),
		input,
		u8a(segment3),
		nameBuffer,
		u8a(segment2),
		u8a(segment4),
		u8a(segment5),
		u8a(segment6),
		// Padding at the end of file to bring size to a multiple of 256
		new ArrayBuffer(paddingLen),
	);
};

export default zip_;
