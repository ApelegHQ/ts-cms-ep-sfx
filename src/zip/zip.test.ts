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
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { TestContext } from 'node:test';
import { after, before, describe, it } from 'node:test';
import sharedBufferToUint8Array from './sharedBufferToUint8Array.js';
import zip from './zip.js';

const exeify = (() => {
	const isWin32 = process.platform === 'win32';
	return (cmd: TemplateStringsArray) => `${cmd[0]}${isWin32 ? '.exe' : ''}`;
})();

describe('ZIP', () => {
	let testTempDir: string;

	before(async () => {
		testTempDir = await mkdtemp(join(tmpdir(), 'ziptesttemp-'));
	});

	after(async () => {
		if (!testTempDir) return;
		await rm(testTempDir, { force: true, recursive: true });
	});

	const verifyCmd = (
		t: TestContext,
		cmd: string | string[],
		args: string[],
		checker: (output: Uint8Array) => boolean,
	) => {
		let command: string | false = false;
		if (!Array.isArray(cmd)) cmd = [cmd];
		for (const cmd_ of cmd) {
			try {
				const { stdout } = spawnSync(cmd_, args, {
					stdio: ['ignore'],
				});
				if (checker(stdout)) {
					command = cmd_;
					break;
				}
			} catch {
				// empty
			}
		}

		if (!command) {
			t.skip();
		}

		return command;
	};

	const runTest = async (
		t: TestContext,
		cmd: string | string[],
		checkArgs: string[],
		checker: (output: Uint8Array) => boolean,
		cmdArgs: (zipPath: string, givenFilename: string) => string[],
	) => {
		const command = verifyCmd(t, cmd, checkArgs, checker);
		if (!command) return;

		for (const coerceZip64 of [false, true, 2]) {
			const givenFilename = crypto
				.randomUUID()
				.slice(0, (6 + (0, Math.random)() * 30) | 0);
			const givenInputData = Buffer.from(
				new Uint8Array((17 + (0, Math.random)() * 256) | 0),
			);
			crypto.getRandomValues(givenInputData);
			const r = zip(givenFilename, givenInputData, coerceZip64);

			assert.ok(r.byteLength % 256 === 0);

			const zipPath = join(testTempDir, `${crypto.randomUUID()}.zip`);
			await writeFile(zipPath, Buffer.from(sharedBufferToUint8Array(r)));
			t.after(() => {
				return unlink(zipPath);
			});

			const decompressionResult: { ['stdout']: Buffer } = spawnSync(
				command,
				cmdArgs(zipPath, givenFilename),
			);
			assert.deepEqual(decompressionResult.stdout, givenInputData);
		}
	};

	it('unzip compatibility', async (t) => {
		const $unzip = exeify`unzip`;

		await runTest(
			t,
			$unzip,
			['-v'],
			(output) => output.subarray(0, 6).toString() === 'UnZip ',
			(zipPath, givenFilename) => ['-p', zipPath, givenFilename],
		);
	});

	it('7z compatibility', async (t) => {
		const $7z = exeify`7z`;

		await runTest(
			t,
			$7z,
			[],
			(output) => output.subarray(0, 6).toString().trim() === '7-Zip',
			(zipPath: string, givenFilename: string) => [
				'-tzip',
				'-so',
				'e',
				'--',
				zipPath,
				givenFilename,
			],
		);
	});

	it('bsdtar compatibility', async (t) => {
		const $bsdtar = exeify`bsdtar`;
		const $tar = exeify`tar`;

		await runTest(
			t,
			[$bsdtar, $tar],
			['--version'],
			(output) => output.subarray(0, 7).toString() === 'bsdtar ',
			(zipPath: string, givenFilename: string) => [
				'-xOf',
				zipPath,
				'--',
				givenFilename,
			],
		);
	});

	it('Python zipfile compatibility', async (t) => {
		const $python3 = exeify`python3`;
		const $python = exeify`python`;

		await runTest(
			t,
			[$python3, $python],
			['--version'],
			(output) => output.subarray(0, 9).toString().trim() === 'Python 3.',
			(zipPath: string, givenFilename: string) => [
				'-c',
				'import sys,zipfile; sys.stdout.buffer.write(zipfile.ZipFile(sys.argv[1]).read(sys.argv[2]))',
				zipPath,
				givenFilename,
			],
		);
	});

	it('Perl IO::Uncompress::Unzip compatibility', async (t) => {
		const $perl5 = exeify`perl5`;
		const $perl = exeify`perl`;

		await runTest(
			t,
			[$perl5, $perl],
			['-V'],
			(output) =>
				output.subarray(0, 19).toString().trim() ===
				'Summary of my perl5',
			(zipPath: string, givenFilename: string) => [
				'-MIO::Uncompress::Unzip',
				'-e',
				'die "Usage: $0 archive member\\n" unless @ARGV==2; my($z,$m)=@ARGV; binmode STDOUT; my $u = IO::Uncompress::Unzip->new($z) or die "cannot read zip\\n"; my $status; for ($status = 1; $status > 0; $status = $u->nextStream()) { if ($u->getHeaderInfo->{Name} eq $m) { my $buf; while (my $n = $u->read($buf, 4096)) { print STDOUT $buf } exit 0 } } die "no member $m\\n"',
				zipPath,
				givenFilename,
			],
		);
	});

	it('.NET System.IO.Compression.FileSystem (PowerShell)', async (t) => {
		const $pwsh = exeify`pwsh`;
		const $powershell = exeify`powershell`;

		await runTest(
			t,
			[$pwsh, $powershell],
			['-h'],
			(output) => output.toString().includes('PowerShell'),
			(zipPath: string, givenFilename: string) => [
				'-NoProfile',
				'-Command',
				`$zip=${JSON.stringify(zipPath)}; $member=${JSON.stringify(givenFilename)};Add-Type -AssemblyName System.IO.Compression.FileSystem; $zf=[System.IO.Compression.ZipFile]::OpenRead($zip); $e=$zf.Entries | Where-Object { $_.FullName -eq $member }; if(-not $e) { throw "Member not found: $member"}$stream=$e.Open(); $stdout=[Console]::OpenStandardOutput(); $buffer=New-Object byte[] 81920; while(($r=$stream.Read($buffer,0,$buffer.Length)) -gt 0){ $stdout.Write($buffer,0,$r) } $stream.Dispose(); $zf.Dispose()`,
			],
		);
	});
});
