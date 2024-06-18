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

const bufferEqual_ = (
	a: AllowSharedBufferSource,
	b: AllowSharedBufferSource,
) => {
	let r = a.byteLength ^ b.byteLength;

	const u8a = ArrayBuffer.isView(a)
		? new Uint8Array(a.buffer, a.byteOffset, a.byteLength)
		: new Uint8Array(a);

	const u8b = ArrayBuffer.isView(b)
		? new Uint8Array(b.buffer, b.byteOffset, b.byteLength)
		: new Uint8Array(b);

	const minLength = Math.min(a.byteLength, b.byteLength);
	for (let i = 0; i < minLength; i++) {
		r |= u8a[i] ^ u8b[i];
	}

	return r === 0;
};

export default bufferEqual_;
