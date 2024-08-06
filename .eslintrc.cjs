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

module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint', 'svelte'],
	env: { node: true },
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier',
		'plugin:prettier/recommended',
		'plugin:svelte/recommended',
		'plugin:svelte/prettier',
	],
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
	overrides: [
		{
			files: ['*.js', '*.schema.json', 'package.json', '*.d.ts'],
			rules: {
				'@typescript-eslint/naming-convention': 'off',
			},
		},
		{
			files: ['*.json', 'closure-externs.js'],
			rules: {
				'@typescript-eslint/no-unused-expressions': 'off',
			},
		},
		{
			files: ['*.cjs', '*.cts'],
			rules: {
				'@typescript-eslint/no-require-imports': 'off',
			},
		},
		{
			files: ['*.svelte'],
			parser: 'svelte-eslint-parser',
			env: {
				browser: true,
			},
			parserOptions: {
				parser: '@typescript-eslint/parser',
				tsconfigRootDir: __dirname,
				project: ['./tsconfig.json'],
				extraFileExtensions: ['.svelte'],
			},
		},
	],
	settings: {
		svelte: {
			typescript: true,
		},
	},
};
