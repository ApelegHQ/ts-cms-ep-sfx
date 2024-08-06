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

export const downloadBlob_ = (blob: Blob, filename?: string) => {
	const url = URL.createObjectURL(blob);
	const a = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
	a.style.setProperty('display', 'none');
	a.style.setProperty('position', 'absolute');
	a.style.setProperty('transform', 'scale(0)');
	a.setAttribute('href', url);
	a.setAttribute(
		'download',
		filename || (blob instanceof File && blob.name) || '',
	);
	document.body.appendChild(a);
	const download = () => {
		try {
			a.click();
		} finally {
			a.remove();
			URL.revokeObjectURL(url);
		}
	};
	// The timeout allows the download to be intercepted by automation systems
	setTimeout(download, 0);
};

export default downloadBlob_;
