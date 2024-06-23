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

import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const boundaryMatchRegex =
	/;\s*boundary=(?:"([0-9a-zA-Z'()+_,\-./:=? ]{0,69}[0-9a-zA-Z'()+_,\-./:=?])"|([0-9a-zA-Z'+_\-.]{0,69}[0-9a-zA-Z'+_\-.]))/;

const server = http.createServer((req, res) => {
	const okHandler = (data: Buffer) => {
		const firstScriptIndex = Buffer.from(data).indexOf('<script');
		res.writeHead(200, [
			['cross-origin-embedder-policy', 'credentialless'],
			['cross-origin-opener-policy', 'same-origin'],
			['cross-origin-resource-policy', 'same-origin'],
			['content-type', 'text/html; charset=UTF-8'],
			[
				'content-security-policy',
				"default-src 'none'; script-src 'self' 'unsafe-eval' data:; script-src-elem blob: data:; script-src-attr 'none'; style-src data:; child-src blob:; connect-src blob: data:; frame-ancestors 'self'; form-action 'self' data:",
			],
			[
				'permissions-policy',
				'accelerometer=(), ambient-light-sensor=(), autoplay=(), battery=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=()',
			],
			['referrer-policy', 'no-referrer'],
			['x-content-type-options', 'nosniff'],
			['x-frame-options', 'DENY'],
			['x-robots-tag', 'none'],
			['x-xss-protection', '1; mode=block'],
		]);
		if (firstScriptIndex >= 0) {
			res.write(data.subarray(0, firstScriptIndex));
			res.write(
				'\r\n<!-- START: Signal CI environment -->\r\n' +
					`<script src="data:text/javascript,${encodeURIComponent('window.__CI__=!0')}"></script>` +
					'\r\n<!-- END: Signal CI environment -->\r\n',
			);
			res.write(data.subarray(firstScriptIndex));
		} else {
			res.write(data);
		}
	};

	if (req.url === '/.well-known/time') {
		res.writeHead(204).end();
	}

	if (req.method === 'GET' && ['/', '/index.html'].includes(req.url || '')) {
		const bundlePath = path.resolve(
			__dirname,
			path.join('..', '..', 'build', 'index.html'),
		);
		fs.readFile(bundlePath)
			.then(okHandler)
			.catch((e) => {
				console.error('Error sending index', e);
				res.writeHead(
					500,
					(e instanceof Error && e?.message) ||
						String(e) ||
						'Unknown error',
				);
			})
			.finally(() => res.end());
	} else if (req.method === 'GET' && req.url === '/blank') {
		try {
			okHandler(
				Buffer.from(
					'<!DOCTYPE html>' +
						'<html xml:lang="zxx" xmlns="http://www.w3.org/1999/xhtml" lang="zxx">' +
						'<head>' +
						'<meta charset="UTF-8"/>' +
						'<title>Blank page</title>' +
						'</head>' +
						'<body></body>' +
						'</html>',
				),
			);
		} catch (e) {
			console.error('Error sending /blank', e);
			res.writeHead(
				500,
				(e instanceof Error && e?.message) ||
					String(e) ||
					'Unknown error',
			);
		} finally {
			res.end();
		}
	} else if (req.method === 'GET' && req.url === '/echo-document') {
		try {
			okHandler(
				Buffer.from(
					'<!DOCTYPE html>' +
						'<html xml:lang="zxx" xmlns="http://www.w3.org/1999/xhtml" lang="zxx">' +
						'<head>' +
						'<meta charset="UTF-8"/>' +
						'<title>Echo document</title>' +
						'</head>' +
						'<body>' +
						'<form enctype="multipart/form-data" method="POST">' +
						'<input type="file" name="__TEXT__"/>' +
						'<button type="submit">Submit</button>' +
						'</form>' +
						'</body>' +
						'</html>',
				),
			);
		} catch (e) {
			console.error('Error sending /echo-document', e);
			res.writeHead(
				500,
				(e instanceof Error && e?.message) ||
					String(e) ||
					'Unknown error',
			);
		} finally {
			res.end();
		}
	} else if (req.method === 'POST' && req.url === '/echo-document') {
		if (
			!req.headers['content-type'] ||
			!req.headers['content-type'].startsWith('multipart/form-data;')
		) {
			res.writeHead(415).end();
			return;
		}

		const boundaryMatch =
			req.headers['content-type'].match(boundaryMatchRegex);
		if (!boundaryMatch || (!boundaryMatch[1] && !boundaryMatch[2])) {
			res.writeHead(422).end();
			return;
		}
		const boundary = boundaryMatch[1] || boundaryMatch[2];

		new Promise<Buffer>((resolve) => {
			const chunks: Buffer[] = [];
			req.on('data', (chunk: Buffer) => {
				chunks.push(chunk);
			});
			req.on('end', () => {
				const result = Buffer.concat(chunks);

				resolve(result);
			});
		})
			.then((buffer) => {
				const startMultipartBody = buffer.indexOf('--' + boundary);
				const startMultipartData = buffer.indexOf(
					'\r\n\r\n',
					startMultipartBody + 2 + boundary.length,
				);
				const endMultipartData = buffer.indexOf(
					'\r\n--' + boundary + '--',
					startMultipartData,
				);

				return buffer.subarray(
					startMultipartData + 4,
					endMultipartData,
				);
			})
			.then(okHandler)
			.catch((e) => {
				console.error('Error sending index', e);
				try {
					if (!res.headersSent) {
						res.writeHead(500, e?.message || e || 'Unknown error');
					}
				} catch (e) {
					console.error('Additional error in handler', e);
				}
			})
			.finally(() => {
				try {
					res.end();
				} catch (e) {
					console.error('Error ending request', e);
				}
			});
	} else {
		try {
			res.writeHead(501).end();
		} catch (e) {
			console.error('Error sending 501', e);
		}
	}
});

server.listen(
	process.env.LISTEN_PORT ? parseInt(process.env.LISTEN_PORT) : 20741,
);

server.on('error', (err) => {
	console.error('Server error', err);
	process.exit(1);
});
