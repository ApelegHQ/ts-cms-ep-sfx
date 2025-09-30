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

import sharedBufferToUint8Array from './sharedBufferToUint8Array.js';

const sharedBufferConcat_ = (
	...src: AllowSharedBufferSource[]
): BufferSource => {
	const result = new Uint8Array(
		src.reduce((acc, cv) => acc + cv.byteLength, 0),
	);
	void src.reduce((acc, cv) => {
		const octets = sharedBufferToUint8Array(cv);
		result.set(octets, acc);
		return acc + cv.byteLength;
	}, 0);

	return result.buffer;
};

export default sharedBufferConcat_;
