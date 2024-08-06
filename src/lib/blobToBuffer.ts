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

const blobToBuffer_ = (blob: Blob) => {
	if (typeof blob.arrayBuffer === 'function') {
		// More modern API, it also works on iOS Safari in lockdown mode
		return blob.arrayBuffer();
	} else if (typeof FileReader === 'function') {
		// Older and more widely-supported API
		return new Promise<ArrayBuffer>((resolve, reject) => {
			const fileReader = new FileReader();
			fileReader.onerror = () => {
				reject(fileReader.error);
			};
			fileReader.onload = () => {
				resolve(fileReader.result as ArrayBuffer);
			};
			fileReader.readAsArrayBuffer(blob);
		});
	} else {
		throw new Error('Unable to read file contents');
	}
};

export default blobToBuffer_;
