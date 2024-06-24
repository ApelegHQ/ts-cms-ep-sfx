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

import type { WebDriver, WebElement } from 'selenium-webdriver';

const waitUntilNotBusy_ = async (driver: WebDriver, target$: WebElement) => {
	await driver.executeAsyncScript(
		'const target$ = arguments[0];' +
			'const name = arguments[1];' +
			'const desiredValue = arguments[2];' +
			'const callback = arguments[arguments.length - 1];' +
			'const value = target$.getAttribute(name);' +
			'if (desiredValue === value) {' +
			'callback();' +
			'}' +
			'const observer = new MutationObserver((mutationList) => {' +
			'for (const mutation of mutationList) {' +
			'if (mutation.target !== target$) continue;' +
			'if (mutation.type !== "attributes") continue;' +
			'if (mutation.attributeName !== name) continue;' +
			'const value = target$.getAttribute(name);' +
			'if (desiredValue === value) {' +
			'callback();' +
			'observer.disconnect();' +
			'}' +
			'}' +
			'});' +
			'observer.observe(target$, { attributes: true });',
		target$,
		'aria-busy',
		'false',
	);
};

export default waitUntilNotBusy_;
