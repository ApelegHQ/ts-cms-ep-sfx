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

import type { WebDriver } from 'selenium-webdriver';

const interceptDownload_ = async (driver: WebDriver) => {
	const downloadKey = crypto.randomUUID();
	await driver.executeScript(
		`
        const key = arguments[0];
        const callback = arguments[arguments.length - 1];
        const observer = new MutationObserver((mutationList) => {
            for (const mutation of mutationList) {
                if (mutation.type !== 'childList') continue;
                for (const child of mutation.addedNodes) {
                    if (
                        child instanceof HTMLAnchorElement &&
                        child.hasAttribute('download') &&
                        child.hasAttribute('href')
                    ) {
                        observer.disconnect();

                        const download = child.getAttribute('download');
                        const href = child.getAttribute('href');
                        child.removeAttribute('download');
                        child.removeAttribute('href');
                        child.onclick = (e) => {
                            e.preventDefault();

                            Object.defineProperty(window, key, {
                                configurable: true,
                                value: fetch(href).then(async (res) => {
                                    if (!res.ok) {
                                        throw new Error('Unsuccessful response');
                                    }
                                    const type = res.headers.get('content-type');
                                    const contents = await res.arrayBuffer();
                                    return [
                                        type,
                                        download,
                                        Array.from(new Uint8Array(contents)),
                                    ];
                                }),
                            });
                        };
                    }
                }
            }
        });
        
        observer.observe(document, { childList: true, subtree: true });
        `,
		downloadKey,
	);

	return async () => {
		const result = await driver.executeAsyncScript(
			`
        const key = arguments[0];
        const callback = arguments[arguments.length - 1];
        if (!Object.prototype.hasOwnProperty.call(window, key)) {
            throw new Error('Missing download object');
        }
        const result = window[key];
        delete window[key];
        result.then((v) => callback([true, v]), (e) => callback([false, e?.message || e]));
        `,
			downloadKey,
		);
		if (!Array.isArray(result)) {
			throw new Error('Invalid result');
		}
		if (!result[0]) {
			throw new Error(result[1]);
		}
		const type = result[1][0];
		const name = result[1][1];
		const encryptedFileContents = Buffer.from(result[1][2]);

		return new File([encryptedFileContents], name, { ['type']: type });
	};
};

export default interceptDownload_;
