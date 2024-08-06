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

const fileDecryptionCms_ = async (
	deriveKEK: {
		(): Promise<CryptoKey>;
	},
	noncePWRI: AllowSharedBufferSource,
	encryptedKey: AllowSharedBufferSource,
	nonceECI: AllowSharedBufferSource,
	encryptedContent: AllowSharedBufferSource,
): Promise<AllowSharedBufferSource> => {
	const KEK = await deriveKEK();

	const rawCEK = await crypto.subtle.decrypt(
		{
			['name']: 'AES-GCM',
			['iv']: noncePWRI,
			['tagLength']: 128,
		},
		KEK,
		encryptedKey,
	);
	const CEK = await crypto.subtle.importKey(
		'raw',
		rawCEK,
		{ ['name']: 'AES-GCM', ['length']: 256 },
		false,
		['decrypt'],
	);
	const data = await crypto.subtle.decrypt(
		{
			['name']: 'AES-GCM',
			['iv']: nonceECI,
			['tagLength']: 128,
		},
		CEK,
		encryptedContent,
	);
	return data;
};

export default fileDecryptionCms_;
