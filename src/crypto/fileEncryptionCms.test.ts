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
import { before, describe, it } from 'node:test';
import fileEncryptionCms from './fileEncryptionCms.js';

describe('fileEncryptionCms', async () => {
	let dummyDashedCryptoKey: CryptoKey;
	const dummySalt = new Uint8Array([20, 21, 22, 23]);
	const dummyIterationCount = 2048;

	const dummyData = new Uint8Array([100, 101, 102, 103, 104, 105]);

	const dummyDeriveKek = async (): Promise<
		[KEK: CryptoKey, salt: AllowSharedBufferSource, iterationCount: number]
	> => {
		return [dummyDashedCryptoKey, dummySalt, dummyIterationCount];
	};

	before(async () => {
		dummyDashedCryptoKey = await crypto.subtle.generateKey(
			{ ['name']: 'AES-CBC', ['length']: 128 },
			false,
			['encrypt'],
		);
	});

	it('Returns all the expected values', async () => {
		const [
			salt,
			iterationCount,
			ivPWRI,
			encryptedKey,
			nonceECI,
			encryptedContent,
			tag,
		] = await fileEncryptionCms(dummyDeriveKek, dummyData);

		// Check that salt and iteration count come from our dummy deriveKek.
		assert.deepEqual(
			salt,
			dummySalt,
			'Salt should be the same as provided by deriveKek',
		);
		assert.equal(
			iterationCount,
			dummyIterationCount,
			'Iteration count should be from deriveKek',
		);

		// ivPWRI: should be a Uint8Array of length 16 that was randomly generated.
		assert.ok(
			ivPWRI instanceof ArrayBuffer || ArrayBuffer.isView(ivPWRI),
			'ivPWRI should be a buffer',
		);
		assert.equal(ivPWRI.byteLength, 16, 'ivPWRI should have 16 bytes');

		// encryptedKey: provided by our stub pwriKeyWrap.
		assert.ok(
			encryptedKey instanceof ArrayBuffer ||
				ArrayBuffer.isView(encryptedKey),
			'encryptedKey should be an ArrayBuffer',
		);
		assert.equal(
			encryptedKey.byteLength,
			48,
			'encryptedKey should have 48 bytes',
		);

		// nonceECI: should be a randomly-generated Uint8Array of length 12
		assert.ok(
			nonceECI instanceof ArrayBuffer || ArrayBuffer.isView(nonceECI),
			'nonceECI should be an ArrayBuffer',
		);
		assert.equal(nonceECI.byteLength, 12, 'nonceECI should have 12 bytes');

		assert.ok(
			encryptedContent instanceof ArrayBuffer ||
				ArrayBuffer.isView(encryptedContent),
			'encryptedContent should be an ArrayBuffer',
		);
		assert.equal(
			encryptedContent.byteLength,
			dummyData.byteLength,
			'encryptedContent should have the same length as the input',
		);

		assert.ok(
			tag instanceof ArrayBuffer || ArrayBuffer.isView(tag),
			'tag should be an ArrayBuffer',
		);
		assert.equal(tag.byteLength, 16, 'tag should have 16 bytes');
	});
});
