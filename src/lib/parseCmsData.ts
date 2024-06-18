/* Copyright © 2024 Exact Realty Limited. All rights reserved.
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

const derIntegerToUint = (buffer: Uint8Array): number => {
	if (buffer[0] & 0x80) {
		throw new RangeError('Value out of range');
	}
	if (buffer.length > 7 && (buffer[0] & 0xf0) !== 0x00) {
		throw new RangeError('Value out of range');
	}
	let value = 0;
	for (const c of buffer) {
		// TODO: This won't work for values over 2**31 - 1
		value = (value << 8) | c;
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
	noncePWRI: AllowSharedBufferSource,
	encryptedKey: AllowSharedBufferSource,
	nonceECI: AllowSharedBufferSource,
	encryptedContent: AllowSharedBufferSource,
] => {
	const u8Buf = ArrayBuffer.isView(buf)
		? new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
		: new Uint8Array(buf);

	let pos = 0;
	// First byte must be a sequence
	// SEQUENCE
	assertEq(u8Buf[pos], 0x30);
	pos += lenOffset(u8Buf, pos);
	// OBJECT            :pkcs7-envelopedData
	assertDeepEq(
		u8Buf.subarray(pos, pos + 2 + 9),
		[0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x07, 0x03],
	);
	pos += 2 + 9;
	// cont [ 0 ]
	assertEq(u8Buf[pos], 0xa0);
	pos += lenOffset(u8Buf, pos);
	// SEQUENCE
	assertEq(u8Buf[pos], 0x30);
	pos += lenOffset(u8Buf, pos);
	// INTEGER           :03
	assertDeepEq(u8Buf.subarray(pos, pos + 3), [0x02, 0x01, 0x03]);
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
			0x09, 0x05, 0x00,
		],
	);
	pos += 14;
	// SEQUENCE
	//   OBJECT            :id-alg-PWRI-KEK
	//   SEQUENCE
	//     OCTET STRING
	assertDeepEq(
		u8Buf.subarray(pos, pos + 32),
		[
			0x30, 0x2d, 0x06, 0x0b, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01,
			0x09, 0x10, 0x03, 0x09, 0x30, 0x1e, 0x06, 0x09, 0x60, 0x86, 0x48,
			0x01, 0x65, 0x03, 0x04, 0x01, 0x2e, 0x30, 0x11, 0x04, 0x0c,
		],
	);
	pos += 32;
	const noncePWRI = u8Buf.subarray(pos, pos + 12);
	pos += 12;
	//   INTEGER           :10
	// OCTET STRING
	assertDeepEq(u8Buf.subarray(pos, pos + 4), [0x02, 0x01, 0x10, 0x04]);
	pos += 3;
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
	//   OBJECT            :aes-256-gcm
	//   SEQUENCE
	//     OCTET STRING
	assertDeepEq(
		u8Buf.subarray(pos, pos + 28),
		[
			0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x07, 0x01,
			0x30, 0x1e, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04,
			0x01, 0x2e, 0x30, 0x11, 0x04, 0x0c,
		],
	);
	pos += 28;
	const nonceECI = u8Buf.subarray(pos, pos + 12);
	pos += 12;
	// INTEGER           :10
	assertDeepEq(u8Buf.subarray(pos, pos + 3), [0x02, 0x01, 0x10]);
	pos += 3;
	// cont [ 0 ]
	assertEq(u8Buf[pos], 0x80);
	pos += lenOffset(u8Buf, pos);
	const encryptedData = u8Buf.subarray(pos);

	return [
		salt,
		iterationCount,
		noncePWRI,
		encryptedPassword,
		nonceECI,
		encryptedData,
	];
};

export default parseCmsData_;
