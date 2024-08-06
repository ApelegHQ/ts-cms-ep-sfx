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

import commentCdataExtractor from './commentCdataExtractor.js';
import downloadBlob from './downloadBlob.js';
import generateHtml from './generateHtml.js';

const downloadArchive_ = async (
	mainScript$: HTMLScriptElement,
	mainStylesheet$: HTMLLinkElement,
	openPgpSignature$: HTMLScriptElement,
	archiveName: string,
	encryptedContent?: string[] | undefined,
	hint?: string | undefined,
) => {
	const handleResponseText = (r: Response) => {
		if (!r.ok) throw new Error('Invalid response code');
		return r.arrayBuffer();
	};

	const [scriptSrc, styleSrc] = await Promise.all([
		fetch(mainScript$.src).then(handleResponseText),
		fetch(mainStylesheet$.href).then(handleResponseText),
	]);

	const signatureData = commentCdataExtractor(openPgpSignature$.text);

	const htmlDocument = await generateHtml(
		scriptSrc,
		styleSrc,
		signatureData,
		encryptedContent,
		hint,
	);

	downloadBlob(
		new Blob([htmlDocument], {
			['type']: 'text/html',
		}),
		archiveName,
	);
};

export default downloadArchive_;
