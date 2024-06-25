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

/// <reference types="svelte" />

import App from '~/App.svelte';
import { ROOT_ELEMENT_ID_ } from '~/lib/elementIds.js';
import isCI from '~/lib/isCI.js';

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
	const rootId = ROOT_ELEMENT_ID_;
	const oldRoot = document.getElementById(rootId);

	if (!oldRoot) {
		throw new Error('No element to attach to');
	}

	if (__buildtimeSettings__.ssr) {
		void new App({
			['target']: oldRoot,
			['hydrate']: true,
		});
	} else {
		const target = document.createElementNS(
			'http://www.w3.org/1999/xhtml',
			'div',
		);
		target.setAttribute('id', rootId);

		void new App({
			['target']: target,
		});

		oldRoot.parentElement!.replaceChild(target, oldRoot);
	}

	window.onerror = null;
	const error$ = document.getElementById('error');
	if (error$?.parentElement) {
		error$.parentElement.removeChild(error$);
	}
});
