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

const newId = () => {
	const buf = new Uint8Array(16);
	globalThis.crypto.getRandomValues(buf);
	return Array.from(buf)
		.map((c) => c.toString(16).padStart(2, '0'))
		.join('');
};

class Cache<TV> {
	keyCache_: Record<string, TV>;

	constructor() {
		this.keyCache_ = Object.create(null);
	}

	get_(key: string): TV {
		if (Object.prototype.hasOwnProperty.call(this.keyCache_, key)) {
			return this.keyCache_[key];
		}
		console.error('XXX', key);
		throw new RangeError('Non-existent key');
	}

	add_(value: TV): string {
		const key = newId();
		this.keyCache_[key] = value;

		return key;
	}
}

export default Cache;
