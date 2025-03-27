/* Copyright © 2025 Apeleg Limited. All rights reserved.
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

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import constructCmsData from '../../src/lib/constructCmsData.js';
import deriveKEK from '../../src/lib/deriveKEK.js';
import fileDecryptionCms from '../../src/lib/fileDecryptionCms.js';
import fileEncryptionCms from '../../src/lib/fileEncryptionCms.js';
import parseCmsData from '../../src/lib/parseCmsData.js';
import sharedBufferToUint8Array from '../../src/lib/sharedBufferToUint8Array.js';
import { execSync } from 'node:child_process';

class InterceptedError extends Error {}

const mapper = (v: AllowSharedBufferSource | number) => {
	if (typeof v === 'object') return sharedBufferToUint8Array(v);
	return v;
};

const testEncryptionDecryption = async (
	inputPassword: string,
	decryptionPassword: null | string,
	inputIterations: number,
	inputData: AllowSharedBufferSource,
) => {
	const encryptionResult = await fileEncryptionCms(
		() => deriveKEK(inputPassword, inputIterations, ['encrypt']),
		inputData,
	).catch((e) => {
		throw new InterceptedError('Encryption error', { cause: e });
	});

	assert.equal(encryptionResult[1], inputIterations, 'Wrong iteration count');
	assert.equal(encryptionResult[2].byteLength, 16, 'Wrong IV length');
	assert.equal(
		encryptionResult[3].byteLength,
		48,
		'Wrong wrapped key length',
	);
	assert.equal(encryptionResult[4].byteLength, 12, 'Wrong GCM nonce length');
	assert.equal(
		encryptionResult[5].byteLength,
		inputData.byteLength,
		'Wrong encrypted payload length',
	);
	assert.equal(
		encryptionResult[6].byteLength,
		16,
		'Wrong GCM authentication tag length',
	);

	const derCmsAuthEnvelopedData = (() => {
		const [
			salt,
			iterationCount,
			ivPWRI,
			encryptedKey,
			nonceECI,
			encryptedContent,
			tag,
		] = encryptionResult;

		return constructCmsData(
			salt,
			iterationCount,
			ivPWRI,
			encryptedKey,
			nonceECI,
			encryptedContent,
			tag,
		).derEncode();
	})();

	const parsedResult = parseCmsData(derCmsAuthEnvelopedData);
	assert.deepEqual(
		parsedResult.map(mapper),
		encryptionResult.map(mapper),
		'Parsed data must match source data',
	);

	const result = await (() => {
		const [
			salt,
			iterationCount,
			ivPWRI,
			encryptedKey,
			nonceECI,
			encryptedContent,
			tag,
		] = encryptionResult;

		return fileDecryptionCms(
			() =>
				deriveKEK(
					decryptionPassword ?? inputPassword,
					iterationCount,
					['decrypt', 'encrypt'],
					salt,
				).then(([KEK]) => KEK),
			ivPWRI,
			encryptedKey,
			nonceECI,
			encryptedContent,
			tag,
		).catch((e) => {
			throw new InterceptedError('Decryption error', { cause: e });
		});
	})();

	assert.deepEqual(
		sharedBufferToUint8Array(result),
		sharedBufferToUint8Array(inputData),
		'Decrypted output must equal original input',
	);
};

const randomFill = (data: Uint8Array) => {
	for (let i = 0; i < data.length; i += 4096) {
		crypto.getRandomValues(
			data.subarray(i, Math.min(i + 4096, data.length)),
		);
	}
	return data;
};

const disturbBuffer = (data: Uint8Array, v: number) => {
	const f = ((0, Math.random)() * 255) | 0;
	for (let k = 0; k < data.length; k++) {
		data[k] = data[k] ^ (f + v + k);
	}
	return data;
};

const generateRandomPassword = () => {
	const buffer = new Uint8Array((2 + (0, Math.random)() * 6) | 0);
	crypto.getRandomValues(buffer);
	return btoa(String.fromCharCode(...Array.from(buffer))).replace(
		/={1,2}$/,
		'',
	);
};

describe('CMS primitives', () => {
	it('Fails to decrypt using the wrong password', async () => {
		const password = generateRandomPassword();
		const wrongPassword =
			String.fromCharCode(password.charCodeAt(0) + 1) + password.slice(1);

		await assert.rejects(
			testEncryptionDecryption(
				password,
				wrongPassword,
				10,
				new Uint8Array(5),
			),
			(e) => {
				assert.ok(e && e instanceof InterceptedError);
				assert.equal(e.message, 'Decryption error');
				assert.ok(e.cause && e.cause instanceof Error);
				assert.equal(e.cause.message, 'Invalid check bytes');

				return true;
			},
		);
	});

	it('Can encrypt and decrypt various payloads', async () => {
		const data = randomFill(new Uint8Array(65537));

		const iterations = [1, 255, 1023, 1048575];
		const dataLength = [0, 1, 127, 128, 255, 65535, 65536, 65537];

		for (let i = 0; i < dataLength.length; i++) {
			for (let j = 0; j < iterations.length; j++) {
				const input = disturbBuffer(
					data.slice(0, dataLength[i]),
					i + j,
				);

				await testEncryptionDecryption(
					generateRandomPassword(),
					null,
					iterations[j],
					input,
				);
			}
		}
	});

	it('Can encrypt and decrypt large payloads', async () => {
		const data = randomFill(new Uint8Array(16842752));

		const dataLength = [16777210, 16777216, 16842752];

		for (let i = 0; i < dataLength.length; i++) {
			const input = disturbBuffer(data.slice(0, dataLength[i]), i);

			await testEncryptionDecryption(
				generateRandomPassword(),
				null,
				6,
				input,
			);
		}
	});

	it('OpenSSL compatibility', async (t) => {
		const openssl =
			process.platform === 'win32' ? 'openssl.exe' : 'openssl';

		try {
			const output = execSync(`${openssl} version`, {
				stdio: ['ignore'],
			});
			if (
				output.subarray(0, 8).toString() !== 'OpenSSL ' ||
				!(parseInt(output.subarray(8, 12).toString(), 10) >= 3)
			) {
				throw new Error('OpenSSL expected');
			}
		} catch {
			t.skip();
			return;
		}

		const inputData = randomFill(Buffer.alloc(32));

		const encryptionResult = await fileEncryptionCms(
			() => deriveKEK('MyPassword', 1024, ['encrypt']),
			inputData,
		);
		const data = sharedBufferToUint8Array(
			constructCmsData(...encryptionResult).derEncode(),
		);

		const decryptionResult = execSync(
			`${openssl} cms -decrypt -pwri_password MyPassword -inform DER`,
			{
				input: data,
			},
		);
		assert.deepEqual(decryptionResult, inputData);
	});
});
