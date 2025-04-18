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
import { execSync } from 'node:child_process';
import { mkdtemp, rmdir, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import zip from './zip.js';

describe('ZIP', () => {
	let testTempDir: string;

	before(async () => {
		testTempDir = await mkdtemp(join(tmpdir(), 'ziptesttemp-'));
	});

	after(async () => {
		if (!testTempDir) return;
		await rmdir(testTempDir);
	});

	it('unzip compatibility', async (t) => {
		const unzip = process.platform === 'win32' ? 'unzip.exe' : 'unzip';

		try {
			const output = execSync(`${unzip} -v`, {
				stdio: ['ignore'],
			});
			if (output.subarray(0, 6).toString() !== 'UnZip ') {
				throw new Error('UnZip expected');
			}
		} catch {
			t.skip();
			return;
		}

		const givenFilename = 'ABCDFE';
		const givenInputData = Buffer.from(new Uint8Array(242));
		const r = zip(givenFilename, givenInputData, false);

		assert.ok(r.byteLength % 256 === 0);

		const zipPath = join(testTempDir, `${crypto.randomUUID()}.zip`);
		await writeFile(zipPath, Buffer.from(r));
		t.after(() => {
			return unlink(zipPath);
		});

		const decompressionResult = execSync(
			`${unzip} -p "${zipPath}" "${givenFilename}"`,
		);
		assert.deepEqual(decompressionResult, givenInputData);
	});
});
