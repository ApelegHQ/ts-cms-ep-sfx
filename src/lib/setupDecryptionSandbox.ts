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

import browserSandbox from '@exact-realty/lot/browser';
import * as deriveKEK from 'inline:~/sandbox/deriveKEK.js';
import * as fileDecryptionCms from 'inline:~/sandbox/fileDecryptionCms.js';
import getWrappedCryptoFunctions from './getWrappedCryptoFunctions.js';
import type { fileDecryptionCms$SEP_ } from './sandboxEntrypoints.js';
import {
	deriveKEK$SEP_,
	external$decrypt$SEP_,
	external$deriveKey$SEP_,
	external$importKey$SEP_,
} from './sandboxEntrypoints.js';

const setupDecryptionSandbox_ = (
	passwordGetter: { (): string },
	iterationCountGetter: { (): number },
	saltGetter: { (): AllowSharedBufferSource },
	signal?: AbortSignal,
) => {
	const wrappedCryptoFunctions = getWrappedCryptoFunctions();

	return browserSandbox<{
		[deriveKEK$SEP_]: {
			(
				password: string,
				iterationCount: number,
				keyUsage: KeyUsage,
				salt?: AllowSharedBufferSource | undefined,
			): [
				KEK: CryptoKey,
				salt: AllowSharedBufferSource,
				iterationCount: number,
			];
		};
	}>(
		deriveKEK.default,
		null,
		{
			[external$deriveKey$SEP_]: wrappedCryptoFunctions.deriveKey_,
			[external$importKey$SEP_]: wrappedCryptoFunctions.importKey_,
		},
		signal,
	).then((sandbox) =>
		browserSandbox<{
			[fileDecryptionCms$SEP_]: {
				(
					noncePWRI: AllowSharedBufferSource,
					encryptedKey: AllowSharedBufferSource,
					nonceECI: AllowSharedBufferSource,
					encryptedContent: AllowSharedBufferSource,
					filenameNoncePWRI?: AllowSharedBufferSource,
					filenameEncryptedKey?: AllowSharedBufferSource,
					filenameNonceECI?: AllowSharedBufferSource,
					filenameEncryptedContent?: AllowSharedBufferSource,
				):
					| [AllowSharedBufferSource]
					| [AllowSharedBufferSource, string];
			};
		}>(
			fileDecryptionCms.default,
			null,
			{
				[deriveKEK$SEP_]: async () => {
					const [KEK] = await sandbox(
						deriveKEK$SEP_,
						passwordGetter(),
						iterationCountGetter(),
						'decrypt',
						saltGetter(),
					);

					return KEK;
				},
				[external$decrypt$SEP_]: wrappedCryptoFunctions.decrypt_,
				[external$importKey$SEP_]: wrappedCryptoFunctions.importKey_,
			},
			signal,
		),
	);
};
export default setupDecryptionSandbox_;
