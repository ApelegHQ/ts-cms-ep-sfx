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

// The main purpose of this loader is to avoid loading a long `data:` URL,
// which makes stack traces ugly.
(() => {
	const ns = 'http://www.w3.org/1999/xhtml';

	const mainScript$ = document.getElementById('MAIN_SCRIPT_SRC_ELEMENT__');
	if (!mainScript$ || !(mainScript$ instanceof HTMLScriptElement)) {
		throw new Error('Missing main script element');
	}
	mainScript$.remove();
	const text = atob(mainScript$.text.replace(/[^a-zA-Z0-9+/=]/g, ''));
	const blob = new Blob([text], { ['type']: 'text/javascript' });
	const script$ = document.createElementNS(ns, 'script');
	script$.setAttribute('crossorigin', 'anonymous');
	const integrity = mainScript$.getAttribute('data-integrity');
	if (integrity) {
		script$.setAttribute('integrity', integrity);
	}
	script$.setAttribute('id', 'MAIN_SCRIPT_ELEMENT__');
	script$.setAttribute('src', URL.createObjectURL(blob));
	document.head.appendChild(script$);
})();
