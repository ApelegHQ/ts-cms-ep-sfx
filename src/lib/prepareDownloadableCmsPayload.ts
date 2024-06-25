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

import chunkString from './chunkString.js';
import {
	constructCmsData$SEP_,
	fileEncryptionCms$SEP_,
} from './sandboxEntrypoints.js';
import type setupConstructCmsSandbox from './setupConstructCmsSandbox.js';
import type setupEncryptionSandbox from './setupEncryptionSandbox.js';
import uint8ArrayToBase64 from './uint8ArrayToBase64.js';

const derToPem = (derEncoded: AllowSharedBufferSource) => {
	const fiveDashes = String.prototype.repeat.call('-', 5);
	const cmsBeginMarker = fiveDashes + 'BEGIN CMS' + fiveDashes + '\r\n';
	const cmsEndMarker = fiveDashes + 'END CMS' + fiveDashes + '\r\n';

	const buf = ArrayBuffer.isView(derEncoded)
		? new Uint8Array(
				derEncoded.buffer,
				derEncoded.byteOffset,
				derEncoded.byteLength,
			)
		: new Uint8Array(derEncoded);
	const base64EncodedBuf = uint8ArrayToBase64(buf);

	const cmsPemData =
		cmsBeginMarker +
		(base64EncodedBuf
			? chunkString(base64EncodedBuf).join('\r\n') + '\r\n'
			: '') +
		cmsEndMarker;

	return cmsPemData;
};

const prepareDownloadableCmsPayload_ = async (
	cmsSandbox: Awaited<ReturnType<typeof setupConstructCmsSandbox>>,
	encryptionSandbox: Awaited<ReturnType<typeof setupEncryptionSandbox>>,
	buffer: AllowSharedBufferSource,
	filename: string,
): Promise<[dataCms: string, filenameCms: string]> => {
	if (
		typeof cmsSandbox !== 'function' ||
		typeof encryptionSandbox !== 'function'
	) {
		throw new TypeError('sandbox is not a function');
	}

	const data = await encryptionSandbox(
		fileEncryptionCms$SEP_,
		buffer,
		filename,
	);

	return (
		await Promise.all([
			cmsSandbox(
				constructCmsData$SEP_,
				data[0],
				data[1],
				data[2],
				data[3],
				data[4],
				data[5],
			),
			cmsSandbox(
				constructCmsData$SEP_,
				data[0],
				data[1],
				data[6],
				data[7],
				data[8],
				data[9],
			),
		])
	).map((x) => derToPem(x)) as [string, string];
};

export default prepareDownloadableCmsPayload_;
