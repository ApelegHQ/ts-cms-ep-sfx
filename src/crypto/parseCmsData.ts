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

const lenCalc = (
	buffer: Uint8Array,
	pos: number,
): [offset: number, length: number] => {
	const val = buffer[pos + 1];
	if (val < 0x80) {
		return [2, val];
	} else if (val === 0x81) {
		return [3, buffer[pos + 2] << 0o00];
	} else if (val === 0x82) {
		return [4, (buffer[pos + 2] << 0o10) | (buffer[pos + 3] << 0o00)];
	} else if (val === 0x83) {
		return [
			5,
			(buffer[pos + 2] << 0o20) |
				(buffer[pos + 3] << 0o10) |
				(buffer[pos + 4] << 0o00),
		];
	} else if (val === 0x84) {
		return [
			6,
			((buffer[pos + 2] << 0o30) |
				(buffer[pos + 3] << 0o20) |
				(buffer[pos + 4] << 0o10) |
				(buffer[pos + 5] << 0o00)) >>>
				0,
		];
	}

	throw new Error('Invalid length offset');
};

const assertEq = <T>(actual: T, expected: T): void => {
	if (actual !== expected) {
		throw new Error('assertEq failed');
	}
};

const assertLen = (buffer: Uint8Array, pos: number, expectedLen: number) => {
	const val = lenCalc(buffer, pos);
	assertEq(val[0] + val[1], expectedLen);
	return val[0];
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

	let pos = 0;
	// First byte must be a sequence
	// SEQUENCE
	assertEq(u8Buf[pos], 0x30);
	pos += assertLen(u8Buf, pos, u8Buf.byteLength);
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
	pos += assertLen(u8Buf, pos, u8Buf.byteLength - pos);
	// SEQUENCE
	assertEq(u8Buf[pos], 0x30);
	pos += assertLen(u8Buf, pos, u8Buf.byteLength - pos);
	// INTEGER           :00
	assertDeepEq(u8Buf.subarray(pos, pos + 3), [0x02, 0x01, 0x00]);
	pos += 3;
	// SET
	assertEq(u8Buf[pos], 0x31);
	const recipientInfosLen = lenCalc(u8Buf, pos);
	pos += recipientInfosLen[0];
	const recipientInfosStart = pos;
	// cont [ 3 ]
	assertEq(u8Buf[pos], 0xa3);
	const recipientInfoLen = lenCalc(u8Buf, pos);
	pos += recipientInfoLen[0];
	assertEq(
		pos - recipientInfosStart,
		recipientInfosLen[1] - recipientInfoLen[1],
	);
	// INTEGER           :00
	assertDeepEq(u8Buf.subarray(pos, pos + 3), [0x02, 0x01, 0x00]);
	pos += 3;
	// cont [ 0 ]
	assertEq(u8Buf[pos], 0xa0);
	const keyDerivationAlgoLen = lenCalc(u8Buf, pos);
	pos += keyDerivationAlgoLen[0];
	const keyDerivationAlgoStart = pos;
	// OBJECT            :PBKDF2
	assertDeepEq(
		u8Buf.subarray(pos, pos + 11),
		[0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x05, 0x0c],
	);
	pos += 11;
	// SEQUENCE
	assertEq(u8Buf[pos], 0x30);
	const pkbdf2ParamsLen = lenCalc(u8Buf, pos);
	pos += pkbdf2ParamsLen[0];
	const pkbdf2ParamsStart = pos;
	// OCTET STRING
	assertEq(u8Buf[pos], 0x04);
	const saltLen = lenCalc(u8Buf, pos);
	pos += saltLen[0];
	const salt = u8Buf.subarray(pos, pos + saltLen[1]);
	pos += saltLen[1];
	// INTEGER
	assertEq(u8Buf[pos], 0x02);
	const iterationCountLen = lenCalc(u8Buf, pos);
	pos += iterationCountLen[0];
	const iterationCount = derIntegerToUint(
		u8Buf.subarray(pos, pos + iterationCountLen[1]),
	);
	pos += iterationCountLen[1];
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
	assertEq(pos - keyDerivationAlgoStart, keyDerivationAlgoLen[1]);
	assertEq(pos - pkbdf2ParamsStart, pkbdf2ParamsLen[1]);
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
	const encryptedPasswordLen = lenCalc(u8Buf, pos);
	pos += encryptedPasswordLen[0];
	const encryptedPassword = u8Buf.subarray(
		pos,
		pos + encryptedPasswordLen[1],
	);
	pos += encryptedPasswordLen[1];
	assertEq(pos - recipientInfosStart, recipientInfosLen[1]);
	// SEQUENCE
	assertEq(u8Buf[pos], 0x30);
	const dataSeqLen = lenCalc(u8Buf, pos);
	pos += dataSeqLen[0];
	const dataSeqStart = pos;
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
	const dataLen = lenCalc(u8Buf, pos);
	pos += dataLen[0];
	const encryptedData = u8Buf.subarray(pos, pos + dataLen[1]);
	pos += dataLen[1];
	assertEq(dataSeqLen[1], pos - dataSeqStart);
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
