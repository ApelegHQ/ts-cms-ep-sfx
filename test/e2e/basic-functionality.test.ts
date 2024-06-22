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

import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { WebDriver } from 'selenium-webdriver';
import { Browser, Builder, By, until } from 'selenium-webdriver';
import EFormFields from '../../src/lib/EFormFields.js';
import dragAndDropFile from './lib/dragAndDropFile.js';
import getRandomFileContents from './lib/getRandomFileContents.js';
import getRandomFileName from './lib/getRandomFileName.js';
import getRandomPassword from './lib/getRandomPassword.js';
import interceptDownload from './lib/interceptDownload.js';
import navigateToFile from './lib/navigateToFile.js';

const baseUrl = new URL(process.env.BASE_URL || 'http://localhost:20741/');

test('Basic functionality', async (t) => {
	let driver: WebDriver = undefined as unknown as WebDriver;

	t.before(async () => {
		try {
			driver = await new Builder()
				.forBrowser(process.env.BROWSER || Browser.CHROME)
				.build();
		} catch (e) {
			if (
				e &&
				e instanceof Error &&
				(e.message.includes('Unable to obtain browser driver') ||
					(e.name === 'WebDriverError' &&
						e.message.includes('unknown error: cannot find')) ||
					e.name === 'SessionNotCreatedError')
			) {
				t.skip();
				return;
			}
			throw e;
		}
	});

	t.after(async () => {
		await driver?.quit();
	});

	const fileName = getRandomFileName();
	const contents = getRandomFileContents();
	const password = getRandomPassword();
	let file: File | undefined = undefined;

	await t.test('Can encrypt a file', async (t) => {
		if (typeof driver === 'undefined') {
			return t.skip();
		}

		await driver.get(baseUrl.toString());

		// Encrypt a file
		await driver.wait(until.elementLocated(By.css('form')));

		await driver.findElement(By.css('h1')).isDisplayed();
		await driver.findElement(By.css('h2')).isDisplayed();

		const password$ = await driver.findElement(
			By.css(
				`form input[name="${EFormFields.PASSWORD}"][type="password"]`,
			),
		);

		assert.ok(!(await password$.isEnabled()));

		await driver
			.findElement(
				By.css(`form input[name="${EFormFields.FILE}"][type="file"]`),
			)
			.findElement(By.xpath('./ancestor::fieldset'))
			.then((dropzone) => dragAndDropFile(dropzone, contents, fileName));

		await driver.wait(until.elementIsEnabled(password$), 100);

		await password$.sendKeys(password);

		await driver
			.findElement(
				By.css(
					`form input[name="${EFormFields.PASSWORD_CONFIRM}"][type="password"]`,
				),
			)
			.sendKeys(password);

		const getDownload = await interceptDownload(driver);

		await driver
			.findElement(By.css('button[type="submit"]'))
			.then(async ($) => {
				if (!(await $.isEnabled())) {
					throw new Error('Submit button is disabled');
				}
				return $.click();
			});

		await driver
			.findElements(By.css('.loading-text'))
			.then((loadingText$) =>
				Promise.all(
					loadingText$.map(($) =>
						driver.wait(until.stalenessOf($), 120000),
					),
				),
			);
		assert.equal((await driver.findElements(By.css('dialog'))).length, 0);

		file = await getDownload();
		assert.equal(file.name, fileName + '.html');
	});

	await t.test('Can decrypt a file', { ['skip']: !file }, async () => {
		navigateToFile(driver, baseUrl, file as File);

		await driver.wait(until.elementLocated(By.css('form')));

		await driver.findElement(By.css('h1')).isDisplayed();
		await driver.findElement(By.css('h2')).isDisplayed();

		await driver
			.findElement(
				By.css(
					`form input[name="${EFormFields.PASSWORD}"][type="password"]`,
				),
			)
			.sendKeys(password);

		await driver
			.findElement(By.css('button[type="submit"]'))
			.then(async ($) => {
				if (!(await $.isEnabled())) {
					throw new Error('Submit button is disabled');
				}
				return $.click();
			});

		await driver
			.findElements(By.css('.loading-text'))
			.then((loadingText$) =>
				Promise.all(
					loadingText$.map(($) =>
						driver.wait(until.stalenessOf($), 120000),
					),
				),
			);
		assert.equal((await driver.findElements(By.css('dialog'))).length, 0);

		const getDownload = await interceptDownload(driver);

		await driver
			.findElement(By.css('button[type="submit"]'))
			.then(async ($) => {
				if (!(await $.isEnabled())) {
					throw new Error('Submit button is disabled');
				}
				return $.click();
			});

		assert.equal((await driver.findElements(By.css('dialog'))).length, 0);

		file = await getDownload();
		assert.equal(file.name, fileName);
		assert.deepEqual(new Uint8Array(await file.arrayBuffer()), contents);
	});
});
