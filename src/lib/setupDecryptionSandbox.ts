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

import browserSandbox from '@apeleghq/lot/browser';
import * as deriveKek from 'inline:~/sandbox/deriveKek.js';
import * as fileDecryptionCms from 'inline:~/sandbox/fileDecryptionCms.js';
import * as unzip from 'inline:~/sandbox/unzip.js';
import getWrappedCryptoFunctions from './getWrappedCryptoFunctions.js';
import {
	deriveKek$SEP_,
	external$decrypt$SEP_,
	external$deriveKey$SEP_,
	external$encrypt$SEP_,
	external$importKey$SEP_,
	fileDecryptionCms$SEP_,
	unzip$SEP_,
} from './sandboxEntrypoints.js';

const setupDecryptionSandbox_ = async (
	passwordGetter: { (): string },
	iterationCountGetter: { (): number },
	saltGetter: { (): AllowSharedBufferSource },
	signal?: AbortSignal,
) => {
	const wrappedCryptoFunctions = getWrappedCryptoFunctions();

	const [deriveKekSandbox, unzipSandbox] = await Promise.all([
		browserSandbox<{
			[deriveKek$SEP_]: {
				(
					password: string,
					iterationCount: number,
					keyUsages: KeyUsage[],
					salt?: AllowSharedBufferSource | undefined,
				): [
					KEK: CryptoKey,
					salt: AllowSharedBufferSource,
					iterationCount: number,
				];
			};
		}>(
			deriveKek.default,
			null,
			{
				[external$deriveKey$SEP_]: wrappedCryptoFunctions.deriveKey_,
				[external$importKey$SEP_]: wrappedCryptoFunctions.importKey_,
			},
			signal,
		),
		browserSandbox<{
			[unzip$SEP_]: {
				(
					data: AllowSharedBufferSource,
				): [name: string, contents: AllowSharedBufferSource];
			};
		}>(unzip.default, null, null, signal),
	]);

	const decryptionSandbox = await browserSandbox<{
		[fileDecryptionCms$SEP_]: {
			(
				ivPWRI: AllowSharedBufferSource,
				encryptedKey: AllowSharedBufferSource,
				nonceECI: AllowSharedBufferSource,
				encryptedContent: AllowSharedBufferSource,
				tag: AllowSharedBufferSource,
			): AllowSharedBufferSource;
		};
	}>(
		fileDecryptionCms.default,
		null,
		{
			[deriveKek$SEP_]: async () => {
				const [KEK] = await deriveKekSandbox(
					deriveKek$SEP_,
					passwordGetter(),
					iterationCountGetter(),
					['encrypt', 'decrypt'],
					saltGetter(),
				);

				return KEK;
			},
			[external$encrypt$SEP_]: wrappedCryptoFunctions.encrypt_,
			[external$decrypt$SEP_]: wrappedCryptoFunctions.decrypt_,
			[external$importKey$SEP_]: wrappedCryptoFunctions.importKey_,
		},
		signal,
	);

	const decrypt = async (
		ivPWRI: AllowSharedBufferSource,
		encryptedKey: AllowSharedBufferSource,
		nonceECI: AllowSharedBufferSource,
		encryptedContent: AllowSharedBufferSource,
		tag: AllowSharedBufferSource,
	): Promise<[filename: string, contents: AllowSharedBufferSource]> => {
		const data = await decryptionSandbox(
			fileDecryptionCms$SEP_,
			ivPWRI,
			encryptedKey,
			nonceECI,
			encryptedContent,
			tag,
		);

		return unzipSandbox(unzip$SEP_, data);
	};

	return decrypt;
};
export default setupDecryptionSandbox_;
