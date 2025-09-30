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

import { pwriKeyWrap_ as pwriKeyWrap } from './pwriKeyWrapping.js';

const gcmEncrypt = async (
	key: CryptoKey,
	nonce: BufferSource,
	data: BufferSource,
): Promise<
	[encryptedData: AllowSharedBufferSource, tag: AllowSharedBufferSource]
> => {
	const tagLength = 16;
	const result = await crypto.subtle.encrypt(
		{
			['name']: 'AES-GCM',
			['iv']: nonce,
			['tagLength']: tagLength * 8,
		},
		key,
		data,
	);

	return [result.slice(0, data.byteLength), result.slice(data.byteLength)];
};

const fileEncryptionCms_ = async (
	deriveKek: {
		(): Promise<
			[
				KEK: CryptoKey,
				salt: AllowSharedBufferSource,
				iterationCount: number,
			]
		>;
	},
	data: BufferSource,
): Promise<
	[
		salt: AllowSharedBufferSource,
		iterationCount: number,
		ivPWRI: AllowSharedBufferSource,
		encryptedKey: AllowSharedBufferSource,
		nonceECI: AllowSharedBufferSource,
		encryptedContent: AllowSharedBufferSource,
		tag: AllowSharedBufferSource,
	]
> => {
	let iterationCount: number;
	let salt: AllowSharedBufferSource;

	const ivPWRI = new Uint8Array(16);
	const nonceECI = new Uint8Array(12);

	crypto.getRandomValues(ivPWRI);
	crypto.getRandomValues(nonceECI);

	const [encryptedKey, [encryptedContent, tag]] = await crypto.subtle
		.generateKey({ ['name']: 'AES-GCM', ['length']: 256 }, true, [
			'encrypt',
		])
		.then((CEK) => {
			const KEKp = deriveKek().then(([lKEK, lSalt, lIterationCount]) => {
				iterationCount = lIterationCount;
				salt = lSalt;
				return lKEK;
			});

			return Promise.all([
				Promise.all([KEKp, crypto.subtle.exportKey('raw', CEK)]).then(
					([KEK, rawCEK]) => {
						return pwriKeyWrap(KEK, ivPWRI, rawCEK);
					},
				),
				gcmEncrypt(CEK, nonceECI, data),
			]);
		});

	return [
		salt!,
		iterationCount!,
		ivPWRI,
		encryptedKey,
		nonceECI,
		encryptedContent,
		tag,
	];
};

export default fileEncryptionCms_;
