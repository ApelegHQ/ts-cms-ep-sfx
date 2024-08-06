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

import '~/lib/fixBrokenSandboxSecureContext.js';

import fileDecryptionCms from '~/lib/fileDecryptionCms.js';
import { fileDecryptionCms$SEP_ } from '~/lib/sandboxEntrypoints.js';

declare function deriveKEK(): Promise<CryptoKey>;

if (typeof deriveKEK !== 'function') throw new Error('Missing deriveKEK');

const entrypoint_ = async (
	noncePWRI: AllowSharedBufferSource,
	encryptedKey: AllowSharedBufferSource,
	nonceECI: AllowSharedBufferSource,
	encryptedContent: AllowSharedBufferSource,
	filenameNoncePWRI?: AllowSharedBufferSource,
	filenameEncryptedKey?: AllowSharedBufferSource,
	filenameNonceECI?: AllowSharedBufferSource,
	filenameEncryptedContent?: AllowSharedBufferSource,
): Promise<[AllowSharedBufferSource] | [AllowSharedBufferSource, string]> => {
	const cachedDeriveKEK = (() => {
		const unset: Record<never, never> = {};
		let cached: typeof unset | ReturnType<typeof deriveKEK> = unset;

		return (): ReturnType<typeof deriveKEK> => {
			if (cached === unset) {
				cached = deriveKEK();
			}
			return cached as unknown as ReturnType<typeof deriveKEK>;
		};
	})();

	const data = await fileDecryptionCms(
		cachedDeriveKEK,
		noncePWRI,
		encryptedKey,
		nonceECI,
		encryptedContent,
	);

	if (
		!filenameNoncePWRI ||
		!filenameEncryptedKey ||
		!filenameNonceECI ||
		!filenameEncryptedContent
	) {
		return [data];
	}

	try {
		const filenameData = await fileDecryptionCms(
			cachedDeriveKEK,
			filenameNoncePWRI,
			filenameEncryptedKey,
			filenameNonceECI,
			filenameEncryptedContent,
		);

		const filenameBufferU8 = ArrayBuffer.isView(filenameData)
			? new Uint8Array(
					filenameData.buffer,
					filenameData.byteOffset,
					filenameData.byteLength,
				)
			: new Uint8Array(filenameData);

		const filenameBufferU16 = ArrayBuffer.isView(filenameData)
			? new Uint16Array(
					filenameData.buffer,
					filenameData.byteOffset,
					filenameData.byteLength,
				)
			: new Uint16Array(filenameData);

		if (filenameBufferU8[0] !== 0) {
			throw new Error('Unsupported format');
		}

		const length = filenameBufferU8[1];
		if (filenameData.byteLength < (length << 1) + 2) {
			throw new Error('Mismatched lengths');
		}

		const filename = String.fromCharCode(
			...Array.from(filenameBufferU16.subarray(1, 1 + length)),
		);

		return [data, filename];
	} catch {
		return [data];
	}
};

exports[fileDecryptionCms$SEP_] = entrypoint_;
