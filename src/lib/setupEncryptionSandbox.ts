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
import * as fileEncryptionCms from 'inline:~/sandbox/fileEncryptionCms.js';
import getWrappedCryptoFunctions from './getWrappedCryptoFunctions.js';
import type { fileEncryptionCms$SEP_ } from './sandboxEntrypoints.js';
import {
	deriveKEK$SEP_,
	external$deriveKey$SEP_,
	external$encrypt$SEP_,
	external$exportKey$SEP_,
	external$generateKey$SEP_,
	external$importKey$SEP_,
} from './sandboxEntrypoints.js';

const setupEncryptionSandbox_ = (
	passwordGetter: { (): string },
	iterationCountGetter: { (): number },
	signal?: AbortSignal,
) => {
	const wrappedCryptoFunctions = getWrappedCryptoFunctions();

	return browserSandbox<{
		[deriveKEK$SEP_]: {
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
			[external$deriveKey$SEP_]: wrappedCryptoFunctions.deriveKey_,
			[external$importKey$SEP_]: wrappedCryptoFunctions.importKey_,
		},
		signal,
	).then((sandbox) =>
		browserSandbox<{
			[fileEncryptionCms$SEP_]: {
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
				[deriveKEK$SEP_]: () => {
					return sandbox(
						deriveKEK$SEP_,
						passwordGetter(),
						iterationCountGetter(),
						'encrypt',
					);
				},
				[external$encrypt$SEP_]: wrappedCryptoFunctions.encrypt_,
				[external$exportKey$SEP_]: wrappedCryptoFunctions.exportKey_,
				[external$generateKey$SEP_]:
					wrappedCryptoFunctions.generateKey_,
			},
			signal,
		),
	);
};

export default setupEncryptionSandbox_;
