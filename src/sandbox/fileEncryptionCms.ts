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

import fileEncryptionCms from '~/lib/fileEncryptionCms.js';
import { fileEncryptionCms$SEP_ } from '~/lib/sandboxEntrypoints.js';

declare function deriveKEK(): Promise<
	[KEK: CryptoKey, salt: Uint8Array, iterationCount: number]
>;

if (typeof deriveKEK !== 'function') throw new Error('Missing deriveKEK');

const entrypoint_ = async (
	data: AllowSharedBufferSource,
	filename: string,
): Promise<
	[
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
	]
> => {
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

	const dataResult = await fileEncryptionCms(cachedDeriveKEK, data);

	const filenameBuffer = new ArrayBuffer(512);
	const filenameBufferU8 = new Uint8Array(filenameBuffer);
	const filenameBufferU16 = new Uint16Array(filenameBuffer);
	filenameBufferU8[0] = 0;
	filenameBufferU8[1] = filename.length <= 255 ? filename.length : 255;
	filename
		.slice(0, 255)
		.split('')
		.forEach((c, i) => {
			filenameBufferU16[1 + i] = c.charCodeAt(0);
		});

	const filenameResult = await fileEncryptionCms(
		cachedDeriveKEK,
		filenameBuffer,
	);

	return [
		dataResult[0],
		dataResult[1],
		dataResult[2],
		dataResult[3],
		dataResult[4],
		dataResult[5],
		filenameResult[2],
		filenameResult[3],
		filenameResult[4],
		filenameResult[5],
	];
};

exports[fileEncryptionCms$SEP_] = entrypoint_;
