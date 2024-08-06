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

export default {
	theme: {
		fontFamily: {
			mono: [
				'ui-monospace',
				'SFMono-Regular',
				'Menlo',
				'Monaco',
				'Consolas',
				'Liberation Mono',
				'Courier New',
				'monospace',
			],
			sans: ['Poppins', 'DejaVu Sans', 'Verdana', 'Noto Sans', 'sans'],
			serif: [
				'ui-serif',
				'Georgia',
				'Cambria',
				'Times New Roman',
				'Times',
				'serif',
			],
		},
	},
	// content isn't used, but to silence the warning, it's set to this file
	// and 'w-0' (a Tailwind class name) is included, so that the
	// 'No utility classes were detected in your source files.' warning isn't
	// shown
	content: ['./tailwind.config.mjs'],
};
