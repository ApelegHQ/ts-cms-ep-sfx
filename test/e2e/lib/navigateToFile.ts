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
import { until } from 'selenium-webdriver';
import waitUntilReadyStateComplete from './waitUntilReadyStateComplete.js';

const navigateToFile_ = async (driver: WebDriver, url: URL, file: File) => {
	driver.get('about:blank');
	await waitUntilReadyStateComplete(driver);
	const document$: WebElement = await driver.executeScript(
		'return document.documentElement;',
	);
	await driver.executeScript(
		`
        const ns = 'http://www.w3.org/1999/xhtml';
        const form$ = document.createElementNS(ns, 'form');
        form$.setAttribute('action', arguments[0]);
        form$.setAttribute('enctype', 'text/plain');
        form$.setAttribute('method', 'POST');
        const textarea$ = document.createElementNS(ns, 'textarea');
        textarea$.setAttribute('name', '__TEXT__');
        textarea$.value = arguments[1];
        form$.appendChild(textarea$);
        form$.style.setProperty('transform', 'scale(0)', 'important');
        document.body.appendChild(form$);
        form$.submit();
    `,
		url.toString(),
		Buffer.from(await file.arrayBuffer()).toString('utf-8'),
		file.type,
	);
	// Wait until navigation happens
	await driver.wait(until.stalenessOf(document$));
};

export default navigateToFile_;
