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
import deriveKek from './deriveKek.js';

describe('deriveKek correctness', () => {
	it('should produce a valid KEK and return provided salt and iterationCount', async () => {
		const password = 'supersecret';
		const iterationCount = 1000;
		const keyUsages: KeyUsage[] = ['encrypt', 'decrypt'];
		const salt = new Uint8Array(16); // 16 bytes salt for testing
		// fill salt with deterministic values for test predictability
		for (let i = 0; i < salt.length; i++) {
			salt[i] = i;
		}

		const [KEK, retSalt, retIterationCount] = await deriveKek(
			password,
			iterationCount,
			keyUsages,
			salt,
		);

		// Verify that a CryptoKey is returned
		assert.equal(typeof KEK === 'object', true);
		// The returned salt should be the same as provided
		assert.deepEqual(retSalt, salt);
		// The returned iteration count should be the same
		assert.equal(retIterationCount, iterationCount);

		// Optionally check algorithm name of derived key
		assert.equal(KEK.algorithm.name, 'AES-CBC');
	});

	it('should generate a salt if one is not provided', async () => {
		const password = 'anotherpassword';
		const iterationCount = 1500;
		const keyUsages: KeyUsage[] = ['encrypt'];

		const [KEK, salt, retIterationCount] = await deriveKek(
			password,
			iterationCount,
			keyUsages,
		);

		// Check that salt is present and has a valid length
		// (32 as per the function)
		assert.ok(salt);
		assert.equal(salt.byteLength, 32);

		// Check iteration count
		assert.equal(retIterationCount, iterationCount);

		// Check key usages by verifying the derived key's algorithm name
		// and key length
		assert.equal(KEK.algorithm.name, 'AES-CBC');
		assert.equal((KEK.algorithm as AesKeyAlgorithm).length, 256);
	});

	it('should throw TypeError for empty password', async () => {
		const password = '';
		const iterationCount = 1000;
		const keyUsages: KeyUsage[] = ['encrypt'];

		await assert.rejects(
			() => deriveKek(password, iterationCount, keyUsages),
			{
				name: 'TypeError',
				message: 'Invalid or empty password',
			},
			'Expected error for empty password',
		);
	});

	it('should throw TypeError for non-string password', async () => {
		const password = 12345; // not a string
		const iterationCount = 1000;
		const keyUsages: KeyUsage[] = ['decrypt'];

		await assert.rejects(
			() =>
				deriveKek(
					password as unknown as string,
					iterationCount,
					keyUsages,
				),
			{
				name: 'TypeError',
				message: 'Invalid or empty password',
			},
			'Expected error for non-string password',
		);
	});

	it('should throw TypeError for invalid iteration count', async () => {
		const password = 'testpassword';
		const iterationCount = 0; // invalid: less than 1
		const keyUsages: KeyUsage[] = ['encrypt'];

		await assert.rejects(
			() => deriveKek(password, iterationCount, keyUsages),
			{
				name: 'TypeError',
				message: 'Invalid iteration count',
			},
			'Expected error for invalid iteration count',
		);
	});

	it('should throw TypeError for non-integer iteration count', async () => {
		const password = 'testpassword';
		const iterationCount = 1000.5; // non-integer count
		const keyUsages: KeyUsage[] = ['decrypt'];

		await assert.rejects(
			() => deriveKek(password, iterationCount, keyUsages),
			{
				name: 'TypeError',
				message: 'Invalid iteration count',
			},
			'Expected error for non-integer iteration count',
		);
	});

	it('should throw TypeError for iteration count greater than Number.MAX_SAFE_INTEGER', async () => {
		const password = 'testpassword';
		const iterationCount = Number.MAX_SAFE_INTEGER + 1;
		const keyUsages: KeyUsage[] = ['encrypt'];

		await assert.rejects(
			() => deriveKek(password, iterationCount, keyUsages),
			{
				name: 'TypeError',
				message: 'Invalid iteration count',
			},
			'Expected error for iteration count exceeding safe integer limit',
		);
	});

	it('should throw TypeError for invalid key usage', async () => {
		const password = 'testpassword';
		const iterationCount = 1000;
		// invalid usage
		const keyUsages: KeyUsage[] = ['sign'];

		await assert.rejects(
			() => deriveKek(password, iterationCount, keyUsages),
			{
				name: 'TypeError',
				message: 'Invalid key usage',
			},
			'Expected error for invalid key usage',
		);
	});
});
