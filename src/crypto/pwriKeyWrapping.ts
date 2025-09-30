/* Copyright © 202 Apeleg Limited. All rights reserved.
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

import sharedBufferConcat from './sharedBufferConcat.js';
import sharedBufferToUint8Array from './sharedBufferToUint8Array.js';

// See RFC 3211, section 2.3
const pwriKeyWrap_ = async (
	KEK: CryptoKey,
	IV: BufferSource,
	CEK: AllowSharedBufferSource,
): Promise<AllowSharedBufferSource> => {
	const CEKu8 = sharedBufferToUint8Array(CEK);
	const wrappedLen = 4 + CEK.byteLength;
	const paddedLen = Math.max((((wrappedLen - 1) >> 4) + 1) << 4, 32);
	const formattedKey = new Uint8Array(paddedLen);
	formattedKey[0] = CEK.byteLength;
	formattedKey[1] = ~CEKu8[0];
	formattedKey[2] = ~CEKu8[1];
	formattedKey[3] = ~CEKu8[2];
	formattedKey.set(CEKu8, 4);

	if (wrappedLen !== paddedLen) {
		crypto.getRandomValues(formattedKey.subarray(wrappedLen));
	}

	const encryptedPaddedKey = await crypto.subtle.encrypt(
		{
			['name']: 'AES-CBC',
			['iv']: IV,
		},
		KEK,
		formattedKey,
	);

	const wrappedKey = await crypto.subtle.encrypt(
		{
			['name']: 'AES-CBC',
			['iv']: encryptedPaddedKey.slice(paddedLen - 16, paddedLen),
		},
		KEK,
		// Get rid of PKCS#7 padding
		encryptedPaddedKey.slice(0, paddedLen),
	);

	// Get rid of PKCS#7 padding
	return wrappedKey.slice(0, paddedLen);
};

// See RFC 3211, section 2.3
const pwriKeyUnwrap_ = async (
	KEK: CryptoKey,
	IV: BufferSource,
	wrappedCEK: AllowSharedBufferSource,
): Promise<BufferSource> => {
	const wrappedCEKu8 = sharedBufferToUint8Array(wrappedCEK, true);

	// SubtleCrypto expects PKCS#7 padding, so we need to add it.
	const reconstructedPkcs7OuterPadding = (
		await crypto.subtle.encrypt(
			{
				['name']: 'AES-CBC',
				['iv']: wrappedCEKu8.subarray(wrappedCEKu8.byteLength - 16),
			},
			KEK,
			new Uint8Array(new Array(16).fill(16)),
		)
	).slice(0, 16);
	const outerIv = await crypto.subtle.decrypt(
		{
			['name']: 'AES-CBC',
			['iv']: wrappedCEKu8.subarray(
				wrappedCEKu8.byteLength - 32,
				wrappedCEKu8.byteLength - 16,
			),
		},
		KEK,
		sharedBufferConcat(
			wrappedCEKu8.subarray(wrappedCEKu8.byteLength - 16),
			reconstructedPkcs7OuterPadding,
		),
	);

	const encryptedPaddedKey = await crypto.subtle.decrypt(
		{
			['name']: 'AES-CBC',
			['iv']: outerIv,
		},
		KEK,
		sharedBufferConcat(wrappedCEKu8, reconstructedPkcs7OuterPadding),
	);

	const reconstructedPkcs7InnerPadding = (
		await crypto.subtle.encrypt(
			{
				['name']: 'AES-CBC',
				['iv']: encryptedPaddedKey.slice(
					encryptedPaddedKey.byteLength - 16,
				),
			},
			KEK,
			new Uint8Array(new Array(16).fill(16)),
		)
	).slice(0, 16);
	const formattedKey = await crypto.subtle.decrypt(
		{
			['name']: 'AES-CBC',
			['iv']: IV,
		},
		KEK,
		sharedBufferConcat(encryptedPaddedKey, reconstructedPkcs7InnerPadding),
	);

	const formattedKeyU8 = new Uint8Array(formattedKey);

	if (
		((formattedKeyU8[1] ^ formattedKeyU8[4]) &
			(formattedKeyU8[2] ^ formattedKeyU8[5]) &
			(formattedKeyU8[3] ^ formattedKeyU8[6])) !==
		0xff
	) {
		throw new Error('Invalid check bytes');
	}

	if (
		formattedKeyU8[0] < 3 ||
		formattedKeyU8[0] > formattedKeyU8.byteLength - 4
	) {
		throw new Error('Invalid key length');
	}

	return formattedKeyU8.subarray(4, 4 + formattedKeyU8[0]);
};

export { pwriKeyUnwrap_, pwriKeyWrap_ };
