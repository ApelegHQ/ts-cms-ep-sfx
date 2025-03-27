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

/// <reference types="svelte" />

import App from '~/App.svelte';
import { ERROR_ELEMENT_ID_, ROOT_ELEMENT_ID_ } from '~/lib/elementIds.js';
import isCI from '~/lib/isCI.js';
import { generateBody_ } from './lib/generateHtml';

const onLoad = (handler: { (): void }) => {
	if (
		typeof document === 'undefined' ||
		typeof Document !== 'function' ||
		!(document instanceof Document) ||
		typeof self !== 'object' ||
		typeof top !== 'object' ||
		typeof window !== 'object' ||
		typeof Window !== 'function' ||
		!(window instanceof Window)
	) {
		throw new Error('Not executing in a browser context');
	}

	if (__buildtimeSettings__.enableFramebusting && !isCI && self !== top) {
		throw new Error('Not executing in a top-level window');
	}

	if (typeof isSecureContext !== 'boolean' || !isSecureContext) {
		throw new Error('Not executing in a secure context');
	}

	if (
		typeof crypto === 'undefined' ||
		typeof Crypto !== 'function' ||
		!(crypto instanceof Crypto) ||
		typeof crypto.subtle === 'undefined' ||
		typeof SubtleCrypto !== 'function' ||
		!(crypto.subtle instanceof SubtleCrypto)
	) {
		throw new Error('Missing required crypto primitives');
	}

	if (['interactive', 'complete'].indexOf(document.readyState) !== -1) {
		setTimeout(handler, 0);
	} else if (document.addEventListener) {
		const eventListener = () => {
			document.removeEventListener(
				'DOMContentLoaded',
				eventListener,
				false,
			);
			handler();
		};
		document.addEventListener('DOMContentLoaded', eventListener, false);
	} else {
		throw new Error('Unsupported browser');
	}
};

onLoad(() => {
	const ns = 'http://www.w3.org/1999/xhtml';
	const rootId = ROOT_ELEMENT_ID_;
	const parser = new DOMParser();

	const newRoot$ = document.createElementNS(ns, 'div');
	newRoot$.setAttribute('id', rootId);

	// Replace body to reduce the opportunities for tampering with the
	// presentational aspects by modifying unsigned parts of the HTML file.
	const newBodyDocument = parser.parseFromString(
		// Generate no `noscript` tag
		'<html xmlns="' + ns + '">' + generateBody_() + '</html>',
		document.contentType as unknown as DOMParserSupportedType,
	);
	const root$ = newBodyDocument.getElementById(rootId);
	const error$ = newBodyDocument.getElementById(ERROR_ELEMENT_ID_);
	const body$ = document.adoptNode(newBodyDocument.body);
	document.documentElement.replaceChild(body$, document.body);

	// Now, create the App. This needs to be done after replacing body because
	// the sandbox attaches elements to the body that shouldn't be removed.
	// Otherwise, this would come before replacing body.
	void new App({
		['target']: newRoot$,
	});

	if (root$) {
		body$.replaceChild(newRoot$, root$);
	} else {
		body$.appendChild(newRoot$);
	}
	if (error$) {
		body$.removeChild(error$);
	}
	window.onerror = null;
});
