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

const deriveKEK_ = async (
	password: string,
	iterationCount: number,
	keyUsage: KeyUsage,
	salt?: AllowSharedBufferSource | undefined,
): Promise<
	[KEK: CryptoKey, salt: AllowSharedBufferSource, iterationCount: number]
> => {
	if (typeof password !== 'string' || !password) {
		throw new TypeError('Invalid or empty password');
	}
	if (
		typeof iterationCount !== 'number' ||
		iterationCount < 1 ||
		iterationCount !== (iterationCount | 0) ||
		iterationCount > Number.MAX_SAFE_INTEGER
	) {
		throw new TypeError('Invalid iteration count');
	}
	if (
		typeof keyUsage !== 'string' ||
		(keyUsage !== 'encrypt' && keyUsage !== 'decrypt')
	) {
		throw new TypeError('Invalid key usage');
	}

	if (!salt) {
		const saltBuffer = new Uint8Array(32);
		crypto.getRandomValues(saltBuffer);
		salt = saltBuffer;
	}

	const KEK = await crypto.subtle
		.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
			'deriveKey',
		])
		.then((baseKey) => {
			return crypto.subtle.deriveKey(
				{
					['name']: 'PBKDF2',
					['salt']: salt,
					['iterations']: iterationCount,
					['hash']: 'SHA-256',
				},
				baseKey,
				{ ['name']: 'AES-GCM', ['length']: 256 },
				false,
				[keyUsage],
			);
		});

	return [KEK, salt, iterationCount];
};

export default deriveKEK_;
