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

import sharedBufferToUint8Array from './sharedBufferToUint8Array.js';

// Precompute the slicing-by-8 tables for the reflected CRC32.
// The polynomial is 0xEDB88320 and the tables are generated for slices 0..7.
const makeCRCTables = (() => {
	let tables_: Uint32Array[];

	return () => {
		if (!tables_) {
			const poly = 0xedb88320;
			const tables = new Array<Uint32Array>(8);

			// Create the first table (slice 0)
			tables[0] = new Uint32Array(256);
			for (let i = 0; i < 256; i++) {
				let c = i;
				for (let j = 0; j < 8; j++) {
					c = (c & 1 ? poly ^ (c >>> 1) : c >>> 1) >>> 0;
				}
				tables[0][i] = c >>> 0;
			}

			// Build tables for slices 1 to 7 based on table0.
			for (let slice = 1; slice < 8; slice++) {
				tables[slice] = new Uint32Array(256);
				for (let i = 0; i < 256; i++) {
					tables[slice][i] =
						((tables[slice - 1][i] >>> 8) ^
							tables[0][tables[slice - 1][i] & 0xff]) >>>
						0;
				}
			}

			tables_ = tables;
		}
		return tables_;
	};
})();

// Slicing-by-8 CRC32 function
const crc32SlicingBy8_ = (buffer: AllowSharedBufferSource) => {
	const data = sharedBufferToUint8Array(buffer);
	const crcTables = makeCRCTables();
	const len = data.byteLength;
	let i = 0;

	// Initialise the CRC to 0xffffffff
	let crc = 0xffffffff >>> 0;

	if (len >= 8) {
		// Process as many 8-byte blocks as possible.
		const blockEnd = len - (len & 0x07);
		const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);

		for (; i < blockEnd; i += 8) {
			// XOR the next eight bytes into the CRC
			// (note: little-endian processing for the reflected algorithm)
			const lo = dv.getUint32(i, true);
			const hi = dv.getUint32(i + 4, true);
			crc ^= lo;

			// Process next four bytes from the block more aggressively if available.
			// But here, for slicing-by-8, we interleave 8 table lookups:
			crc =
				crcTables[7][(crc >>> 0o00) & 0xff] ^
				crcTables[6][(crc >>> 0o10) & 0xff] ^
				crcTables[5][(crc >>> 0o20) & 0xff] ^
				crcTables[4][(crc >>> 0o30) & 0xff] ^
				crcTables[3][(hi >>> 0o00) & 0xff] ^
				crcTables[2][(hi >>> 0o10) & 0xff] ^
				crcTables[1][(hi >>> 0o20) & 0xff] ^
				crcTables[0][(hi >>> 0o30) & 0xff];
		}
	}

	// Process any remaining bytes one by one.
	for (; i < len; i++) {
		crc = crcTables[0][(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
	}

	// Finalise by inverting the bits.
	return (crc ^ 0xffffffff) >>> 0;
};

export default crc32SlicingBy8_;
