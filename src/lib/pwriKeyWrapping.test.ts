import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	pwriKeyUnwrap_ as pwriKeyUnwrap,
	pwriKeyWrap_ as pwriKeyWrap,
} from './pwriKeyWrapping.js';
import sharedBufferToUint8Array from './sharedBufferToUint8Array.js';

describe('x', () => {
	it('y', async () => {
		const KEK = await crypto.subtle.generateKey(
			{ ['name']: 'AES-CBC', ['length']: 256 },
			false,
			// Need both encrypt and decrypt to reconstruct padding
			['encrypt', 'decrypt'],
		);
		const IV = new Uint8Array(16);
		const CEK = new Uint8Array(32);

		const wrapped = await pwriKeyWrap(KEK, IV, CEK);
		assert.equal(wrapped.byteLength, 48);
		const unwrapped = await pwriKeyUnwrap(KEK, IV, wrapped);

		assert.deepEqual(sharedBufferToUint8Array(unwrapped), CEK);
	});
});
