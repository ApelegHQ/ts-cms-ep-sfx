/* Copyright © 2024 Apeleg Limited. All rights reserved.
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

const derIntegerToUint = (buffer: Uint8Array): number => {
	// No negative values
	if (buffer[0] & 0x80) {
		throw new RangeError('Value out of range');
	}
	// No values over 2**53
	if (
		buffer.length > 7 ||
		(buffer.length === 7 && (buffer[0] & 0xe0) !== 0x00)
	) {
		throw new RangeError('Value out of range');
	}
	let value = 0;
	for (let i = 0; i < buffer.length; i++) {
		if (i <= 3) {
			value = (value << 8) | buffer[i];
		} else {
			value = value * 256 + buffer[i];
		}
	}
	return value;
};

const lenOffset = (buffer: Uint8Array, pos: number): number => {
	const val = buffer[pos + 1];
	if (val < 0x80) {
		return 2;
	} else if (val >= 0x81 && val <= 0x84) {
		return 2 + (val ^ 0x80);
	}
	throw new Error('Invalid length offset');
};

const assertEq = <T>(actual: T, expected: T): void => {
	if (actual !== expected) {
		throw new Error('assertEq failed');
	}
};

const assertDeepEq = <T>(
	actual: ArrayLike<T>,
	expected: ArrayLike<T>,
): void => {
	let r = actual.length ^ expected.length;
	const minLength = Math.min(actual.length, expected.length);
	for (let i = 0; i < minLength; i++) {
		r |= actual[i] === expected[i] ? 0 : 1;
	}
	if (r !== 0) {
		throw new Error('assertDeepEq failed');
	}
};

const parseCmsData_ = (
	buf: AllowSharedBufferSource,
): [
	salt: AllowSharedBufferSource,
	iterationCount: number,
	ivPWRI: AllowSharedBufferSource,
	encryptedKey: AllowSharedBufferSource,
	nonceECI: AllowSharedBufferSource,
	encryptedContent: AllowSharedBufferSource,
	tag: AllowSharedBufferSource,
] => {
	const u8Buf = sharedBufferToUint8Array(buf);
	const dataView = new DataView(
		u8Buf.buffer,
		u8Buf.byteOffset,
		u8Buf.byteLength,
	);

	let pos = 0;
	// First byte must be a sequence
	// SEQUENCE
	assertEq(u8Buf[pos], 0x30);
	pos += lenOffset(u8Buf, pos);
	// OBJECT            :id-smime-ct-authEnvelopedData
	assertDeepEq(
		u8Buf.subarray(pos, pos + 2 + 11),
		[
			0x06, 0x0b, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x09, 0x10,
			0x01, 0x17,
		],
	);
	pos += 2 + 11;
	// cont [ 0 ]
	assertEq(u8Buf[pos], 0xa0);
	pos += lenOffset(u8Buf, pos);
	// SEQUENCE
	assertEq(u8Buf[pos], 0x30);
	pos += lenOffset(u8Buf, pos);
	// INTEGER           :00
	assertDeepEq(u8Buf.subarray(pos, pos + 3), [0x02, 0x01, 0x00]);
	pos += 3;
	// SET
	assertEq(u8Buf[pos], 0x31);
	pos += lenOffset(u8Buf, pos);
	// cont [ 3 ]
	assertEq(u8Buf[pos], 0xa3);
	pos += lenOffset(u8Buf, pos);
	// INTEGER           :00
	assertDeepEq(u8Buf.subarray(pos, pos + 3), [0x02, 0x01, 0x00]);
	pos += 3;
	// cont [ 0 ]
	assertEq(u8Buf[pos], 0xa0);
	pos += lenOffset(u8Buf, pos);
	// OBJECT            :PBKDF2
	assertDeepEq(
		u8Buf.subarray(pos, pos + 11),
		[0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x05, 0x0c],
	);
	pos += 11;
	// SEQUENCE
	assertEq(u8Buf[pos], 0x30);
	pos += lenOffset(u8Buf, pos);
	// OCTET STRING
	assertEq(u8Buf[pos], 0x04);
	pos += lenOffset(u8Buf, pos);
	const saltLen = u8Buf[pos - 1];
	if (saltLen >= 0x80) {
		throw new Error('CMS salt too long');
	}
	const salt = u8Buf.subarray(pos, pos + saltLen);
	pos += saltLen;
	// INTEGER
	assertEq(u8Buf[pos], 0x02);
	pos += lenOffset(u8Buf, pos);
	const iterationCountLen = u8Buf[pos - 1];
	if (iterationCountLen >= 0x80) {
		throw new Error('CMS PBKDF2 iteration count too long');
	}
	const iterationCount = derIntegerToUint(
		u8Buf.subarray(pos, pos + iterationCountLen),
	);
	pos += iterationCountLen;
	// SEQUENCE
	//   OBJECT            :hmacWithSHA256
	//   NULL
	assertDeepEq(
		u8Buf.subarray(pos, pos + 14),
		[
			0x30, 0x0c, 0x06, 0x08, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x02,
			0x0b, 0x05, 0x00,
		],
	);
	pos += 14;
	// SEQUENCE
	//   OBJECT            :id-alg-PWRI-KEK
	//   SEQUENCE
	//     OBJECT            :aes-256-cbc
	//     OCTET STRING
	assertDeepEq(
		u8Buf.subarray(pos, pos + 30),
		[
			0x30, 0x2c, 0x06, 0x0b, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01,
			0x09, 0x10, 0x03, 0x09, 0x30, 0x1d, 0x06, 0x09, 0x60, 0x86, 0x48,
			0x01, 0x65, 0x03, 0x04, 0x01, 0x2a, 0x04, 0x10,
		],
	);
	pos += 30;
	const ivPWRI = u8Buf.subarray(pos, pos + 16);
	pos += 16;
	assertEq(u8Buf[pos], 0x04);
	pos += lenOffset(u8Buf, pos);
	const encryptedPasswordLen = u8Buf[pos - 1];
	if (encryptedPasswordLen >= 0x80) {
		throw new Error('CMS encrypted password too long');
	}
	const encryptedPassword = u8Buf.subarray(pos, pos + encryptedPasswordLen);
	pos += encryptedPasswordLen;
	// SEQUENCE
	assertEq(u8Buf[pos], 0x30);
	pos += lenOffset(u8Buf, pos);
	// OBJECT            :pkcs7-data
	// SEQUENCE
	assertDeepEq(
		u8Buf.subarray(pos, pos + 12),
		[
			0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x07, 0x01,
			0x30,
		],
	);
	pos += 12;
	const aesGcmParamsSequenceLength = u8Buf[pos++];
	//   OBJECT            :aes-256-gcm
	//   SEQUENCE
	//     OCTET STRING
	assertDeepEq(
		u8Buf.subarray(pos, pos + 15),
		[
			0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x01, 0x2e,
			0x30, 0x11, 0x04, 0x0c,
		],
	);
	pos += 15;
	const nonceECI = u8Buf.subarray(pos, pos + 12);
	pos += 12;
	let tagLength;
	if (aesGcmParamsSequenceLength === 0x1e) {
		// INTEGER           :
		assertDeepEq(u8Buf.subarray(pos, pos + 2), [0x02, 0x01]);
		pos += 2;
		tagLength = derIntegerToUint(u8Buf.subarray(pos, ++pos));
	} else if (aesGcmParamsSequenceLength === 0x1b) {
		tagLength = 12;
	} else {
		throw new Error('Invalid params length');
	}
	// cont [ 0 ]
	assertEq(u8Buf[pos], 0x80);
	const offset = lenOffset(u8Buf, pos);
	const len =
		offset === 2
			? u8Buf[pos + 1]
			: offset === 3
				? u8Buf[pos + 2]
				: offset === 4
					? dataView.getUint16(pos + 2, false)
					: offset === 5
						? dataView.getUint16(pos + 2, false) * 256 +
							u8Buf[pos + 4]
						: offset === 6
							? dataView.getUint32(pos + 2, false)
							: NaN;
	pos += offset;
	const encryptedData = u8Buf.subarray(pos, pos + len);
	pos += len;
	// OCTET STRING
	assertEq(u8Buf[pos++], 0x04);
	assertEq(u8Buf[pos++], tagLength);
	const tag = u8Buf.subarray(pos, pos + tagLength);
	pos += tagLength;
	assertEq(pos, u8Buf.byteLength);

	return [
		salt,
		iterationCount,
		ivPWRI,
		encryptedPassword,
		nonceECI,
		encryptedData,
		tag,
	];
};

export default parseCmsData_;
