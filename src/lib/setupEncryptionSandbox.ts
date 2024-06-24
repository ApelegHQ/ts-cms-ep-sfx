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
import * as fileEncryptionCms from 'inline:~/sandbox/fileEncryptionCms.js';
import getWrappedCryptoFunctions from './getWrappedCryptoFunctions.js';

const setupEncryptionSandbox_ = (
	passwordGetter: { (): string },
	iterationCountGetter: { (): number },
	signal?: AbortSignal,
) => {
	const wrappedCryptoFunctions = getWrappedCryptoFunctions();

	// These keys are here to prevent them from being renamed. Compilation
	// should inline them.
	const key$deriveKEK = 'deriveKEK';
	const key$external$deriveKey = 'external$deriveKey';
	const key$external$encrypt = 'external$encrypt';
	const key$external$exportKey = 'external$exportKey';
	const key$external$generateKey = 'external$generateKey';
	const key$external$importKey = 'external$importKey';

	return browserSandbox<{
		[key$deriveKEK]: {
			(
				password: string,
				iterationCount: number,
				keyUsage: KeyUsage,
				salt?: Uint8Array | undefined,
			): [KEK: CryptoKey, salt: Uint8Array, iterationCount: number];
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
			['fileEncryptionCms']: {
				(
					data: AllowSharedBufferSource,
					filename: string,
				): [
					salt: AllowSharedBufferSource,
					iterationCount: number,
					noncePWRI: AllowSharedBufferSource,
					encryptedKey: AllowSharedBufferSource,
					nonceECI: AllowSharedBufferSource,
					encryptedContent: AllowSharedBufferSource,
					filenameNoncePWRI: AllowSharedBufferSource,
					filenameEncryptedKey: AllowSharedBufferSource,
					filenameNonceECI: AllowSharedBufferSource,
					filenameEncryptedContent: AllowSharedBufferSource,
				];
			};
		}>(
			fileEncryptionCms.default,
			null,
			{
				[key$deriveKEK]: () => {
					return sandbox(
						key$deriveKEK,
						passwordGetter(),
						iterationCountGetter(),
						'encrypt',
					);
				},
				[key$external$encrypt]: wrappedCryptoFunctions.encrypt_,
				[key$external$exportKey]: wrappedCryptoFunctions.exportKey_,
				[key$external$generateKey]: wrappedCryptoFunctions.generateKey_,
			},
			signal,
		),
	);
};

export default setupEncryptionSandbox_;
