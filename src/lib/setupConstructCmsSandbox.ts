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

import browserSandbox from '@exact-realty/lot/browser';
import * as constructCmsData from 'inline:~/sandbox/constructCmsData.js';

const setupConstructCmsDataSandbox_ = (signal?: AbortSignal) =>
	browserSandbox<{
		['constructCmsData']: {
			(
				salt: AllowSharedBufferSource,
				iterationCount: number,
				noncePWRI: AllowSharedBufferSource,
				encryptedKey: AllowSharedBufferSource,
				nonceECI: AllowSharedBufferSource,
				encryptedContent: AllowSharedBufferSource,
			): AllowSharedBufferSource;
		};
	}>(constructCmsData.default, null, null, signal);

export default setupConstructCmsDataSandbox_;
