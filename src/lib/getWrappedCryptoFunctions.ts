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

import Cache from './Cache.js';

type TIndirectCryptoKey = string;

const getWrappedCryptoFunctions_ = () => {
	const keyCache = new Cache<CryptoKey>();
	const subtle = crypto.subtle;

	const decrypt = async (
		algorithm:
			| AlgorithmIdentifier
			| RsaOaepParams
			| AesCtrParams
			| AesCbcParams
			| AesGcmParams,
		key: TIndirectCryptoKey,
		data: BufferSource,
	): Promise<ArrayBuffer> => {
		const lookedUpKey = keyCache.get_(key);
		return subtle.decrypt(algorithm, lookedUpKey, data);
	};

	const deriveKey = async (
		algorithm:
			| AlgorithmIdentifier
			| EcdhKeyDeriveParams
			| HkdfParams
			| Pbkdf2Params,
		baseKey: TIndirectCryptoKey,
		derivedKeyType:
			| AlgorithmIdentifier
			| HkdfParams
			| Pbkdf2Params
			| AesDerivedKeyParams
			| HmacImportParams,
		extractable: boolean,
		keyUsages: KeyUsage[],
	): Promise<TIndirectCryptoKey> => {
		const lookedUpKey = keyCache.get_(baseKey);
		const result = await subtle.deriveKey(
			algorithm,
			lookedUpKey,
			derivedKeyType,
			extractable,
			keyUsages,
		);
		return keyCache.add_(result);
	};

	const encrypt = async (
		algorithm:
			| AlgorithmIdentifier
			| RsaOaepParams
			| AesCtrParams
			| AesCbcParams
			| AesGcmParams,
		key: TIndirectCryptoKey,
		data: BufferSource,
	): Promise<ArrayBuffer> => {
		const lookedUpKey = keyCache.get_(key);
		return subtle.encrypt(algorithm, lookedUpKey, data);
	};

	const exportKey = async (format: 'jwk', key: TIndirectCryptoKey) => {
		const lookedUpKey = keyCache.get_(key);
		return subtle.exportKey(format, lookedUpKey);
	};

	const generateKey = async (
		...args: Parameters<SubtleCrypto['generateKey']>
	): Promise<
		| TIndirectCryptoKey
		| {
				['privateKey']: TIndirectCryptoKey;
				['publicKey']: TIndirectCryptoKey;
		  }
	> => {
		const result = await subtle.generateKey(...args);
		if (result instanceof CryptoKey) {
			return keyCache.add_(result);
		} else {
			const keyPair = result;
			const privateKeyId = keyCache.add_(keyPair['privateKey']);
			const publicKeyId = keyCache.add_(keyPair['publicKey']);
			return {
				['privateKey']: privateKeyId,
				['publicKey']: publicKeyId,
			};
		}
	};

	const importKey = async (
		...args: Parameters<SubtleCrypto['importKey']>
	): Promise<TIndirectCryptoKey> => {
		const result = await subtle.importKey(...args);
		return keyCache.add_(result);
	};

	return {
		decrypt_: decrypt,
		deriveKey_: deriveKey,
		encrypt_: encrypt,
		exportKey_: exportKey,
		generateKey_: generateKey,
		importKey_: importKey,
	};
};

export default getWrappedCryptoFunctions_;
