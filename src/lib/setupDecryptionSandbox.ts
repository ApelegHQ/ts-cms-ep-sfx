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

import browserSandbox from '@exact-realty/lot/browser';
import * as deriveKEK from 'inline:~/sandbox/deriveKEK.js';
import * as fileDecryptionCms from 'inline:~/sandbox/fileDecryptionCms.js';
import getWrappedCryptoFunctions from './getWrappedCryptoFunctions.js';

const setupDecryptionSandbox_ = (
	passwordGetter: { (): string },
	iterationCountGetter: { (): number },
	saltGetter: { (): AllowSharedBufferSource },
	signal?: AbortSignal,
) => {
	const wrappedCryptoFunctions = getWrappedCryptoFunctions();

	// These keys are here to prevent them from being renamed. Compilation
	// should inline them.
	const key$deriveKEK = 'deriveKEK';
	const key$external$decrypt = 'external$decrypt';
	const key$external$deriveKey = 'external$deriveKey';
	const key$external$importKey = 'external$importKey';

	return browserSandbox<{
		[key$deriveKEK]: {
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
			[key$external$deriveKey]: wrappedCryptoFunctions.deriveKey_,
			[key$external$importKey]: wrappedCryptoFunctions.importKey_,
		},
		signal,
	).then((sandbox) =>
		browserSandbox<{
			['fileDecryptionCms']: {
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
				[key$deriveKEK]: async () => {
					const [KEK] = await sandbox(
						key$deriveKEK,
						passwordGetter(),
						iterationCountGetter(),
						'decrypt',
						saltGetter(),
					);

					return KEK;
				},
				[key$external$decrypt]: wrappedCryptoFunctions.decrypt_,
				[key$external$importKey]: wrappedCryptoFunctions.importKey_,
			},
			signal,
		),
	);
};
export default setupDecryptionSandbox_;
