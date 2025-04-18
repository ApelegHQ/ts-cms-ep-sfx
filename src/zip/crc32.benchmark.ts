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

import crc32 from './crc32.js';

const benchmark = (fn: () => void) => {
	const runs = new Array(512);
	for (let i = 0; i < runs.length; i++) {
		const start = performance.now();
		fn();
		const elapsed = performance.now() - start;
		runs[i] = elapsed;
	}

	const [sum, sumsq] = runs.reduce(
		([sum, sumsq], v) => {
			return [sum + v, sumsq + v * v];
		},
		[0, 0],
	);

	return [
		sum / runs.length,
		Math.sqrt(
			Math.abs((sumsq - (sum * sum) / runs.length) / (runs.length - 1)),
		) /
			(sum / runs.length),
	];
};

const run = (buf: Uint8Array) => {
	const [elapsed, stdev] = benchmark(() => crc32(buf));
	console.info(
		`[${(buf.length / 1024).toFixed(2).padStart(12, ' ')} KiB]`,
		'Speed',
		Math.round(((buf.byteLength / elapsed) * 1000) / 1024),
		'KiB/s',
		'n. st. dev.',
		stdev,
	);
};

const buf = new Uint8Array(1024 * 1024 * 256 + 13);
for (let i = 0; i < buf.length; i++) {
	buf[i] = ((0, Math.random)() * 256) | 0;
}

run(buf.slice(0, 256));
run(buf.slice(0, 1024 * 1024));
run(buf.slice(0, 1024 * 1024 * 5));
run(buf);
