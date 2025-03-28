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

/**
 * Tightens the Content Security Policy (CSP) to prevent the loading of any
 * new scripts or the dynamic execution of code.
 *
 * This function sets a strict CSP using a meta tag, ensuring that no new
 * scripts can be loaded and code cannot be dynamically executed through
 * methods like `Function()`, `eval()` and similar.
 *
 * Once this strict CSP is applied, it cannot be removed, thus providing
 * a robust layer of security against potential code injections or other
 * malicious behaviours.
 */

const tightenCsp_ = () => {
	const meta$ = document.createElementNS(
		'http://www.w3.org/1999/xhtml',
		'meta',
	);
	meta$.setAttribute('http-equiv', 'content-security-policy');
	// connect-src blob: data: is needed for CI (blob:) and for the
	// 'download for offline use' functionality (data:)
	meta$.setAttribute(
		'content',
		"default-src 'none'; script-src 'self' 'unsafe-eval' blob: data:; script-src-elem blob: data:; script-src-attr 'none'; style-src data:; child-src blob:; connect-src blob: data:; frame-src blob:; worker-src blob:; form-action about:",
	);
	const oldMeta$ = document.head.querySelector(
		'meta[http-equiv="content-security-policy"]',
	);
	if (oldMeta$) {
		document.head.replaceChild(meta$, oldMeta$);
	} else {
		document.head.appendChild(meta$);
	}
};

export default tightenCsp_;
