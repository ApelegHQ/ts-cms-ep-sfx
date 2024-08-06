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

import type { WebElement } from 'selenium-webdriver';

//
// Based on:
// * <https://stackoverflow.com/questions/38829153/selenium-drag-and-drop-from-file-system-to-webdriver>,
// * <https://gist.github.com/florentbr/349b1ab024ca9f3de56e6bf8af2ac69e>
const JS_DROP_FILE = `const target$ = arguments[0],
contents = new Uint8Array(arguments[1]),
filename = arguments[2],
type = arguments[3],
offsetX = arguments[4],
offsetY = arguments[5];

const doc = target$.ownerDocument || document;

let target, clientX, clientY;

for (let i = 0; ; ) {
const box = target$.getBoundingClientRect(),
    clientX = box.left + (offsetX || box.width / 2),
    clientY = box.top + (offsetY || box.height / 2);
target = doc.elementFromPoint(clientX, clientY);

if (target && target$.contains(target)) break;

if (++i > 1) {
    throw new Error('Element not interactable');
}

target$.scrollIntoView({
    behavior: 'instant',
    block: 'center',
    inline: 'center',
});
}

const dataTransfer = new DataTransfer();
dataTransfer.effectAllowed = 'all';
dataTransfer.items.add(new File([contents], filename, { type }));

['dragenter', 'dragover', 'drop'].forEach((type) => {
target.dispatchEvent(
    new DragEvent(type, { clientX, clientY, dataTransfer }),
);
});
`;

const dragAndDropFile_ = async (
	target: WebElement,
	contents: Uint8Array,
	filename: string,
	type = 'application/octet-string',
	offsetX = 0,
	offsetY = 0,
) => {
	const driver = target.getDriver();

	await driver.executeScript(
		JS_DROP_FILE,
		target,
		Array.from(contents),
		filename,
		type,
		offsetX,
		offsetY,
	);
};

export default dragAndDropFile_;
