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

// Needed to address this Chromium issue:
// <https://issues.chromium.org/issues/347282476>

declare const external$decrypt: SubtleCrypto['decrypt'] | undefined;
declare const external$deriveKey: SubtleCrypto['deriveKey'] | undefined;
declare const external$encrypt: SubtleCrypto['encrypt'] | undefined;
declare const external$exportKey: SubtleCrypto['exportKey'] | undefined;
declare const external$generateKey: SubtleCrypto['generateKey'] | undefined;
declare const external$importKey: SubtleCrypto['importKey'] | undefined;

if (!globalThis.crypto.subtle) {
	console.warn(
		'SubtleCrypto is not available. External (unsandboxed) calls will be used instead.',
	);
	const subtlePrototypePolyfill = Object.create(null);

	const assign = <T>(p: PropertyKey, v: T) => {
		Object.defineProperty(subtlePrototypePolyfill, p, {
			['writable']: true,
			['enumerable']: true,
			['configurable']: true,
			['value']: v,
		});
	};

	if (typeof external$decrypt === 'function') {
		assign('decrypt', external$decrypt);
	}

	if (typeof external$deriveKey === 'function') {
		assign('deriveKey', external$deriveKey);
	}

	if (typeof external$encrypt === 'function') {
		assign('encrypt', external$encrypt);
	}

	if (typeof external$exportKey === 'function') {
		assign('exportKey', external$exportKey);
	}

	if (typeof external$generateKey === 'function') {
		assign('generateKey', external$generateKey);
	}

	if (typeof external$importKey === 'function') {
		assign('importKey', external$importKey);
	}

	Object.defineProperty(globalThis.crypto, 'subtle', {
		['configurable']: true,
		['value']: Object.create(subtlePrototypePolyfill),
	});
}
