#!/usr/bin/env node

/* Copyright © 2024 Apeleg Limited. All rights reserved.
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

/* eslint-disable @typescript-eslint/naming-convention */
import cc from '@exact-realty/esbuild-plugin-closure-compiler';
import inlineScripts from '@exact-realty/esbuild-plugin-inline-js';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import childProcess from 'node:child_process';
import { randomUUID, webcrypto } from 'node:crypto';
import fs from 'node:fs/promises';
import { join } from 'node:path';
import vm from 'node:vm';
import postcssCssVariables from 'postcss-css-variables';
import { sveltePreprocess } from 'svelte-preprocess';
import tailwindcss from 'tailwindcss';
import packageJson from './package.json' with { type: 'json' };
import tailwindConfig from './tailwind.config.mjs';

const gitCommitHash = (() => {
	try {
		const result = childProcess.spawnSync('git', ['rev-parse', 'HEAD']);
		if (result.status === 0 && result.stdout.byteLength) {
			return Buffer.from(result.stdout).toString().trim();
		}
	} catch {
		/* empty */
	}
})();

const ENTRY_FILE_CLIENT = 'src/index.ts';
const MODE = process.env['NODE_ENV'] || 'production';
const PUBLIC_DIR = process.env['BUILD_PUBLIC_DIR'] ?? 'public';
const TARGET_DIR = process.env['BUILD_TARGET_DIR'] ?? 'build';
const OUTDIR_CLIENT =
	process.env['BUILD_OUTDIR_CLIENT'] ?? `${TARGET_DIR}/${PUBLIC_DIR}`;
const PUBLIC_PATH = process.env['PUBLIC_PATH'] ?? `about:blank`;

const dev = ['dev', 'development'].includes(MODE);

/**
 * @typedef {Object} ExactRealtyBuilderPluginOptions
 * @property {'client' | 'server' | 'worker' | 'iso'} buildTarget
 * @property {boolean} jsOnly
 */

/**
 *
 * @param {ExactRealtyBuilderPluginOptions} options
 * @returns {esbuild.Plugin}
 **/
const exactRealtyBuilderPlugin = (
	options = { buildTarget: 'iso', jsOnly: false },
) => ({
	name: '@exact-realty/builder',

	setup(build) {
		const buildID = randomUUID();

		const platform = {
			['client']: 'browser',
			['server']: 'node',
			['worker']: 'neutral',
			['iso']: 'browser',
		}[options.buildTarget];

		const entryNames = {
			['client']: 'static/[ext]/[hash]',
			['iso']: 'static/[ext]/[hash]',
		}[options.buildTarget];

		const inject = {
			['client']: [],
			['server']: [],
			['worker']: [],
			['iso']: [],
		}[options.buildTarget];

		const legalComments = {
			['client']: 'eof',
			['server']: 'inline',
			['worker']: 'eof',
			['iso']: 'eof',
		}[options.buildTarget];

		const mangleCache = {};

		Object.assign(build.initialOptions, {
			minify: !dev,
			bundle: true,
			// logLevel: 'silent',
			loader: {
				...build.initialOptions.loader,
				// built-in loaders: js, jsx, ts, tsx, css, json, text, base64, dataurl, file, binary
				'.ttf': 'file',
				'.otf': 'file',
				'.eot': 'file',
				'.woff': 'file',
				'.woff2': 'file',
				// Images
				'.svg': 'file',
				'.jpg': 'file',
				'.webp': 'file',
				// CSS
				'.css': 'css',
			},
			platform: platform,
			define: {
				...build.initialOptions.define,
				'process.env.NODE_ENV': dev ? '"development"' : '"production"',
				'__buildtimeSettings__.ssr': 'false',
				'__buildtimeSettings__.buildTarget': JSON.stringify(
					options.buildTarget,
				),
				'__buildtimeSettings__.enableFramebusting': 'true',
				'__buildtimeSettings__.gitCommitHash':
					JSON.stringify(gitCommitHash) || 'undefined',
				'__buildtimeSettings__.package.name':
					JSON.stringify(Reflect.get(packageJson, 'name')) ||
					'undefined',
				'__buildtimeSettings__.package.version':
					JSON.stringify(Reflect.get(packageJson, 'version')) ||
					'undefined',
				'__buildtimeSettings__.package.description':
					JSON.stringify(Reflect.get(packageJson, 'description')) ||
					'undefined',
				'__buildtimeSettings__.package.keywords':
					JSON.stringify(Reflect.get(packageJson, 'keywords')) ||
					'undefined',
				'__buildtimeSettings__.package.homepage':
					JSON.stringify(Reflect.get(packageJson, 'homepage')) ||
					'undefined',
				'__buildtimeSettings__.package.bugs':
					JSON.stringify(Reflect.get(packageJson, 'bugs')) ||
					'undefined',
				'__buildtimeSettings__.package.license':
					JSON.stringify(Reflect.get(packageJson, 'license')) ||
					'undefined',
				'__buildtimeSettings__.package.author':
					JSON.stringify(Reflect.get(packageJson, 'author')) ||
					'undefined',
				'__buildtimeSettings__.package.repository':
					JSON.stringify(Reflect.get(packageJson, 'repository')) ||
					'undefined',
			},
			sourcemap: !!dev,
			// TODO: dev breaks code
			mangleProps:
				dev || options.buildTarget === 'server'
					? undefined
					: /[^_]_$|^_+$|^_[^_]/,
			mangleQuoted: true,
			reserveProps: /^__[^_]+__$/,
			mangleCache: mangleCache,
			assetNames: 'static/media/[hash]',
			chunkNames: 'static/[ext]/[hash]',
			entryNames: entryNames,
			publicPath: PUBLIC_PATH,
			metafile: true,
			inject: [...(build.initialOptions.inject ?? []), ...(inject ?? [])],
			legalComments: legalComments,
		});

		build.onStart(() => {
			console.log(
				`[${buildID}] build started for ${build.initialOptions.entryPoints?.join(
					', ',
				)}`,
			);
		});

		build.onEnd(async (result) => {
			console.log(
				`[${buildID}] build ended with ${result.errors.length} errors; proceeding with additional transformations`,
			);

			console.log(`[${buildID}] build finished`);
		});
	},
});

(async () => {
	const plugins = [
		inlineScripts(
			{
				target: 'es2015',
				format: 'iife',
				plugins: [
					cc({
						env: 'BROWSER',
						compilation_level: 'ADVANCED',
						language_out: 'ECMASCRIPT5',
					}),
				],
			},
			/^legacy:/,
		),
		inlineScripts({
			target: 'es2020',
			format: 'cjs',
			plugins: [
				cc({
					env: 'BROWSER',
					compilation_level: 'ADVANCED',
					language_out: 'ECMASCRIPT_2020',
				}),
			],
		}),
		sveltePlugin({
			preprocess: sveltePreprocess({
				typescript: {},
				postcss: {
					plugins: [
						tailwindcss(tailwindConfig),
						postcssCssVariables(),
						autoprefixer(),
						cssnano({ preset: 'default' }),
					],
				},
			}),
			compilerOptions: {
				dev: dev,
				generate: 'dom',
				immutable: true,
				css: 'external',
				// This makes XHTML work
				// TODO: if (target.nodeName === "HEAD") { should be "head"
				// in init_hydrate
				namespace: 'http://www.w3.org/1999/xhtml',
				hydratable: true,
				cssHash: (() => {
					const dict = Object.create(null);
					let count = 0;

					return ({ css, hash }) => {
						const hashValue = hash(css);
						if (hashValue in dict) {
							return dict[hashValue];
						}
						const name = (count++)
							.toString(36)
							.replace(/^[0-9]/g, (v) =>
								String.fromCharCode('A'.charCodeAt(0) + +v),
							);
						dict[hashValue] = name;
						return name;
					};
				})(),
				discloseVersion: false,
			},
		}),
		exactRealtyBuilderPlugin({ buildTarget: 'client', jsOnly: false }),
		cc({
			compilation_level: 'ADVANCED',
			language_out: 'ECMASCRIPT_2020',
			externs: './closure-externs.js',
		}),
	];

	const clientBuild = await esbuild.build({
		entryPoints: [ENTRY_FILE_CLIENT],
		mainFields: ['svelte', 'browser', 'module', 'main'],
		outdir: OUTDIR_CLIENT,
		conditions: ['svelte'],
		target: 'es2018',
		plugins,
		define: {
			['global']: 'undefined',
		},
		write: false,
	});

	console.log('Built client');

	const generateHtmlBuild = await esbuild.build({
		entryPoints: ['src/utils/generateHtml.ts'],
		mainFields: ['module', 'main'],
		outdir: OUTDIR_CLIENT,
		target: 'es2018',
		format: 'cjs',
		plugins,
		write: false,
	});

	/**
	 * @param {esbuild.OutputFile[]} files
	 * @param {string} path
	 */
	const findPath = (files, path) => {
		return files.find(
			(x) =>
				x.path.endsWith(path) ||
				x.path.endsWith(path.replace(/\//g, '\\')),
		);
	};

	const outputPath = Object.entries(generateHtmlBuild.metafile.outputs).find(
		([, v]) => {
			return v.entryPoint === 'src/utils/generateHtml.ts';
		},
	)[0];
	const text = findPath(generateHtmlBuild.outputFiles, outputPath).text;

	function requireFromString(src) {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const exports = {};
		const ctx = vm.createContext({
			module: { exports },
			exports,
			btoa,
			atob,
			crypto: webcrypto,
		});
		vm.runInContext(src, ctx);
		return { ...ctx.exports };
	}

	const [scriptOutputPath, { cssBundle: cssBundlePath }] = Object.entries(
		clientBuild.metafile.outputs,
	).find(([, v]) => {
		return v.entryPoint?.endsWith(ENTRY_FILE_CLIENT);
	});

	const scriptText = findPath(
		clientBuild.outputFiles,
		scriptOutputPath,
	).contents;
	const cssText = findPath(clientBuild.outputFiles, cssBundlePath).contents;

	const m = requireFromString(text);

	const prepOutDir = async () => {
		await fs
			.access(TARGET_DIR, fs.constants.W_OK)
			.catch(() => fs.mkdir(TARGET_DIR, { recursive: true }));
	};

	const obtainSignatureInformation = () => {
		const result = childProcess.spawnSync('git', [
			'tag',
			'-l',
			'--format=%(contents:body)',
			'--points-at',
			'HEAD',
			'v*',
		]);

		if (result.status === 0) {
			const lines = result.stdout.toString('utf-8').split(/\r\n|\r|\n/);
			const marker = lines.lastIndexOf('::');
			if (marker < 0) {
				console.warn('No signature information found in git tags');
				return;
			}
			const expectedDigest = lines[marker + 1]
				.trim()
				.replace(/^:/, '')
				.toLowerCase();
			const openPgpSignature = lines
				.slice(marker + 2)
				.map((s) => s.trim())
				.filter((s) => s.startsWith(':'))
				.map((s) => s.replace(/^:/, ''))
				.join('\r\n');

			return [expectedDigest, openPgpSignature];
		} else {
			console.warn('Error getting git tag information');
		}
	};

	switch ((process.env.SIGNATURE_MODE || '').toLowerCase()) {
		case '':
		case 'unsigned': {
			await prepOutDir();

			await fs.writeFile(
				join(TARGET_DIR, 'index.html'),
				await m.default(scriptText, cssText),
			);
			break;
		}
		case 'presign': {
			await prepOutDir();

			await fs.writeFile(
				join(TARGET_DIR, 'tbs'),
				await m.tbsPayload(scriptText, cssText),
			);
			break;
		}
		case 'opportunistic':
		case 'mandatory': {
			// opportunistic or mandatory
			const [expectedDigest, openPgpSignature] =
				obtainSignatureInformation() || [];

			const tbsPayload = await m.tbsPayload(scriptText, cssText);
			const digest = Buffer.from(
				await crypto.subtle.digest(
					{ name: 'SHA-256' },
					Buffer.from(tbsPayload),
				),
			)
				.toString('hex')
				.toLowerCase();

			if (digest !== expectedDigest) {
				console.error('Digest mismatch', { digest, expectedDigest });
				if (process.env.SIGNATURE_MODE.toLowerCase() === 'mandatory') {
					throw new Error('Digest mismatch');
				}
			}

			await prepOutDir();
			await fs.writeFile(
				join(TARGET_DIR, 'index.html'),
				await m.default(scriptText, cssText, openPgpSignature || ''),
			);
			break;
		}
		default:
			throw new Error('Unsupported SIGNATURE_MODE');
	}
})().catch((e) => {
	console.dir(e);
	process.exit(1);
});
