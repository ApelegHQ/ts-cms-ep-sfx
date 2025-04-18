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
import crc32 from './crc32.js';

describe('CRC32', () => {
	const testVectors: [number[] | string, number][] = [
		[[], 0x00000000],
		[new Array(32).fill(0x00), 0x190a55ad],
		[new Array(32).fill(0xff), 0xff6cab0b],
		[new Array(32).fill(null).map((_, i) => i), 0x91267e8a],
		[
			new Array(32)
				.fill(null)
				.map((_, i) => i)
				.reverse(),
			0x9ab0ef72,
		],
		[new Array(255).fill(null).map((_, i) => i), 0xd32f9ba0],
		[
			new Array(255)
				.fill(null)
				.map((_, i) => i)
				.reverse(),
			0x574a2e6a,
		],
		['The quick brown fox jumps over the lazy dog', 0x414fa339],
		['a', 0xe8b7be43],
		['ab', 0x9e83486d],
		['abc', 0x352441c2],
		['abcd', 0xed82cd11],
		['abcde', 0x8587d865],
		['abcdef', 0x4b8e39ef],
		['abcdefg', 0x312a6aa6],
		['abcdefgh', 0xaeef2a50],
		['abcdefghi', 0x8da988af],
		['abcdefghij', 0x3981703a],
		['abcdefghijklmnopqrstuvwxyz', 0x4c2750bd],
		[
			'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
			0x1fc2e6d2,
		],
		['1234567890'.repeat(8), 0x7ca94a72],
		['message digest', 0x20159d7f],
		["I can't remember anything", 0x69147a4e],
		[
			"I can't remember anythingCan\u2019t tell if this is true or dream",
			0x3ee63999,
		],
		['Discard medicine more than two years old.', 0x6b9cdfe7],
		[
			'He who has a shady past knows that nice guys finish last.',
			0xc90ef73f,
		],
		["I wouldn't marry him with a ten foot pole.", 0xb902341f],
		[
			'Free! Free!/A trip/to Mars/for 900/empty jars/Burma Shave',
			0x42080e8,
		],
		[
			'The days of the digital watch are numbered.  -Tom Stoppard',
			0x154c6d11,
		],
		["Nepal premier won't resign.", 0x4c418325],
		[
			'For every action there is an equal and opposite government program.',
			0x33955150,
		],
		[
			"His money is twice tainted: 'taint yours and 'taint mine.",
			0x26216a4b,
		],
		[
			'There is no reason for any individual to have a computer in their home. -Ken Olsen, 1977',
			0x1abbe45e,
		],
		[
			"It's a tiny change to the code and not completely disgusting. - Bob Manchek",
			0xc89a94f7,
		],
		['size:  a.out:  bad magic', 0xab3abe14],
	];

	it('Correctly computes test vectors', () => {
		const textEncoder = new TextEncoder();
		testVectors.forEach(([bytes, crc]) => {
			assert.equal(
				crc32(
					typeof bytes === 'string'
						? textEncoder.encode(bytes)
						: new Uint8Array(bytes),
				),
				crc,
			);
		});
	});
});
