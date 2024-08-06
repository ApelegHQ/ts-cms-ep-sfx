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

import type { WebDriver } from 'selenium-webdriver';
import { By, until } from 'selenium-webdriver';
import waitUntilReadyStateComplete from './waitUntilReadyStateComplete.js';

const navigateToFile_ = async (driver: WebDriver, url: URL, file: File) => {
	driver.get(new URL('echo-document', url).toString());
	await driver.executeScript(
		'document.documentElement.style.setProperty("display", "none", "important");',
	);
	await waitUntilReadyStateComplete(driver);
	const document$ = await driver.findElement(
		By.js('return document.documentElement;'),
	);
	const form$ = await driver.findElement(By.css('form'));
	const fileInput$ = await form$.findElement(By.css('input[type="file"]'));
	await driver.executeScript(
		`
    const target$ = arguments[0],
      contents = new Uint8Array(arguments[1]),
      filename = arguments[2],
      type = arguments[3];
    const dataTransfer = new DataTransfer();
    dataTransfer.effectAllowed = 'all';
    dataTransfer.items.add(new File([contents], filename, { type }));
    target$.files = dataTransfer.files;
	`,
		fileInput$,
		Array.from(new Uint8Array(await file.arrayBuffer())),
		file.name,
		file.type,
	);
	await form$.submit();
	// Wait until navigation happens
	await driver.wait(until.stalenessOf(document$));
};

export default navigateToFile_;
