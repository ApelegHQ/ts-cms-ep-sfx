/* Copyright © 2025 Apeleg Limited. All rights reserved.
 *
 * Permission to use, copy, modify, and distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import plugin from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import svelteParser from 'svelte-eslint-parser';

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

export default [
	{
		ignores: [
			'**/node_modules/*',
			'**/.nyc_output/*',
			'**/dist/*',
			'**/build/*',
			'**/coverage/*',
			'**/package-lock.json',
		],
	},
	js.configs.recommended,
	...compat.extends('plugin:@typescript-eslint/recommended'),
	prettierRecommended,
	// svelte.configs['flat/recommended'],
	// svelte.configs['flat/prettier'],
	{
		languageOptions: {
			parser,
			globals: {
				...globals.node,
			},
		},
		plugins: { plugin, svelte },
		rules: {
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: 'typeParameter',
					format: ['PascalCase'],
					prefix: ['T'],
				},
				{
					selector: 'interface',
					format: ['PascalCase'],
					prefix: ['I'],
				},
				{
					selector: 'enumMember',
					format: ['UPPER_CASE'],
					trailingUnderscore: 'require',
				},
				{
					selector: 'variable',
					modifiers: ['exported'],
					format: ['camelCase', 'PascalCase'],
					trailingUnderscore: 'require',
				},
				{
					selector: 'typeProperty',
					format: ['camelCase'],
					trailingUnderscore: 'require',
				},
				{
					selector: 'method',
					format: ['camelCase'],
					trailingUnderscore: 'require',
				},
			],
		},
		settings: {
			svelte: {
				typescript: true,
			},
		},
	},
	{
		files: ['**/*.js', '**/*.schema.json', '**/package.json', '**/*.d.ts'],
		rules: {
			'@typescript-eslint/naming-convention': 'off',
		},
	},
	{
		files: ['**/*.json', '**/closure-externs.js'],
		rules: {
			'@typescript-eslint/no-unused-expressions': 'off',
		},
	},
	{
		files: ['**/*.cjs', '**/*.cts'],
		rules: {
			'@typescript-eslint/no-require-imports': 'off',
		},
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			globals: {
				...globals.browser,
			},
			parserOptions: {
				parser,
				tsconfigRootDir: __dirname,
				project: ['./tsconfig.json'],
				extraFileExtensions: ['.svelte'],
			},
		},
	},
];
