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

const cmsPemToDer_ = (s: string): AllowSharedBufferSource => {
	const fiveDashes = String.prototype.repeat.call('-', 5);
	const cmsBeginMarker = fiveDashes + 'BEGIN CMS' + fiveDashes;
	const cmsEndMarker = fiveDashes + 'END CMS' + fiveDashes;
	const start = s.indexOf(cmsBeginMarker);
	if (start < 0) {
		throw new RangeError('Unable to find PEM CMS start');
	}
	const end = s.indexOf(cmsEndMarker, start + cmsBeginMarker.length + 1);
	if (end < 0) {
		throw new RangeError('Unable to find PEM CMS end');
	}

	return new Uint8Array(
		atob(
			s
				.slice(start + cmsBeginMarker.length, end)
				.replace(/[^A-Za-z0-9+/=]/g, ''),
		)
			.split('')
			.map((c) => c.charCodeAt(0)),
	);
};

export default cmsPemToDer_;
