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

const sharedBufferToUint8Array_ = <
	TB extends AllowSharedBufferSource,
	TL extends boolean,
	TR extends TB extends ArrayBuffer
		? ArrayBuffer
		: TL extends true
			? ArrayBuffer
			: TB extends ArrayBufferView<infer P>
				? P
				: never,
>(
	buf: TB,
	local?: TL,
): Uint8Array<TR> => {
	if (ArrayBuffer.isView(buf)) {
		const bufCopy =
			!local || buf.buffer instanceof ArrayBuffer
				? (buf.buffer as TR)
				: (buf.buffer.slice() as TR);
		return new Uint8Array(bufCopy).subarray(
			buf.byteOffset,
			buf.byteOffset + buf.byteLength,
		);
	}
	return new Uint8Array(buf) as Uint8Array<TR>;
};

export default sharedBufferToUint8Array_;
