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

import * as fallbackMessage from 'legacy:~/fallbackMessage.inline.js';
import * as loader from 'legacy:~/loader.inline.js';
import chunkString from './chunkString.js';
import {
	CMS_DATA_ELEMENT_ID_,
	CMS_FILENAME_ELEMENT_ID_,
	CMS_HINT_ELEMENT_ID_,
	ERROR_ELEMENT_ID_,
	MAIN_SCRIPT_SRC_ELEMENT_ID_,
	MAIN_STYLESHEET_ELEMENT_ID_,
	OPENPGP_SIGNATURE_ELEMENT_ID_,
} from './elementIds.js';
import {
	xmlEscape_ as xmlEscape,
	xmlEscapeAttr_ as xmlEscapeAttr,
	xmlEscapeJsonScriptCdata_ as xmlEscapeJsonScriptCdata,
} from './xmlEscape.js';
import {
	commentCdataEscapeSequenceEnd_ as commentCdataEscapeSequenceEnd,
	commentCdataEscapeSequenceStart_ as commentCdataEscapeSequenceStart,
} from './commentCdataEscapeSequence.js';

const bbtoa = (buf: AllowSharedBufferSource) => {
	const u8buf = ArrayBuffer.isView(buf)
		? new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
		: new Uint8Array(buf);

	return btoa(
		Array.from(u8buf)
			.map((c) => String.fromCharCode(c))
			.join(''),
	);
};

const sriDigest = async (buf: AllowSharedBufferSource) => {
	const digest = await crypto.subtle.digest({ ['name']: 'SHA-384' }, buf);

	return 'sha384-' + bbtoa(digest);
};

export const tbsPayload_ = async (
	mainScriptText: AllowSharedBufferSource,
	cssText: AllowSharedBufferSource,
) => {
	const mainScriptTextSriDigest = await sriDigest(mainScriptText);
	const cssTextSriDigest = cssText ? await sriDigest(cssText) : '';

	return (
		commentCdataEscapeSequenceEnd +
		'</script>' +
		'<meta charset="UTF-8"/>' +
		'<meta name="viewport" content="width=device-width, initial-scale=1.0"/>' +
		'<meta' +
		' http-equiv="content-security-policy"' +
		// `frame-ancestors` isn't supported as http-equiv and it causes issues
		// with WebKit.
		// `form-action data:` is so that form action=modal works
		` content="default-src 'none'; script-src 'self' 'unsafe-eval' blob: data:; script-src-elem blob: data: '${fallbackMessage.sri}' '${loader.sri}' '${mainScriptTextSriDigest}'; script-src-attr 'none'; style-src data: '${cssTextSriDigest}'; child-src blob:; connect-src blob: data:; frame-src blob:; worker-src blob:; form-action about:"` +
		'/>' +
		`<title>HTML CMS Tool</title>` +
		`<script src="data:text/javascript;base64,${encodeURIComponent(fallbackMessage.contentBase64)}" integrity="${xmlEscapeAttr(fallbackMessage.sri)}" crossorigin="anonymous">` +
		`</script>` +
		'\r\n' +
		`<script type="text/plain" data-integrity="${xmlEscapeAttr(mainScriptTextSriDigest)}" id="${xmlEscapeAttr(MAIN_SCRIPT_SRC_ELEMENT_ID_)}">` +
		commentCdataEscapeSequenceStart +
		xmlEscape(chunkString(bbtoa(mainScriptText), 512).join('\r\n')) +
		commentCdataEscapeSequenceEnd +
		`</script>` +
		'\r\n' +
		`<link rel="stylesheet" href="data:text/css;base64,${encodeURIComponent(bbtoa(cssText))}" crossorigin="anonymous" integrity="${xmlEscapeAttr(cssTextSriDigest)}" id="${xmlEscapeAttr(MAIN_STYLESHEET_ELEMENT_ID_)}"/>` +
		'\r\n' +
		`<script src="data:text/javascript;base64,${encodeURIComponent(loader.contentBase64)}" defer="defer" integrity="${xmlEscapeAttr(loader.sri)}" crossorigin="anonymous">` +
		'</script>' +
		`<script type="application/pgp-signature" id="${xmlEscapeAttr(OPENPGP_SIGNATURE_ELEMENT_ID_)}">` +
		commentCdataEscapeSequenceStart
	);
};

const openPgpSignatureWrapper = (payload: string, signature: string) => {
	const fiveDashes = String.prototype.repeat.call('-', 5);

	return (
		'<script type="text/plain">' +
		commentCdataEscapeSequenceStart +
		`${fiveDashes}BEGIN PGP SIGNED MESSAGE${fiveDashes}\r\n` +
		'Hash: SHA256\r\n\r\n' +
		payload +
		signature.split(/\r\n|\r|\n/).join('\r\n') +
		commentCdataEscapeSequenceEnd +
		'</script>\r\n'
	);
};

const generateHtml_ = async (
	mainScriptText: AllowSharedBufferSource,
	cssText: AllowSharedBufferSource,
	openPgpSignatureText?: string | null | undefined,
	encryptedContent?: string[],
	hint?: string,
) => {
	const pkcs7MimeType = 'application/pkcs7-mime';

	const tbsPayload = await tbsPayload_(mainScriptText, cssText);

	if (hint) {
		hint = hint.replace(/<\//g, '<//');
	}

	return (
		'<!DOCTYPE html>' +
		'<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">' +
		'<head>' +
		(openPgpSignatureText
			? openPgpSignatureWrapper(tbsPayload, openPgpSignatureText)
			: '<script type="text/plain">' +
				commentCdataEscapeSequenceStart +
				tbsPayload +
				commentCdataEscapeSequenceEnd +
				'</script>') +
		(Array.isArray(encryptedContent) && encryptedContent.length > 1
			? `<script type="${xmlEscapeAttr(pkcs7MimeType)}" id="${xmlEscapeAttr(CMS_DATA_ELEMENT_ID_)}">` +
				commentCdataEscapeSequenceStart +
				encryptedContent[0] +
				commentCdataEscapeSequenceEnd +
				`</script>` +
				(encryptedContent[1]
					? `<script type="${xmlEscapeAttr(pkcs7MimeType)}" id="${xmlEscapeAttr(CMS_FILENAME_ELEMENT_ID_)}">` +
						commentCdataEscapeSequenceStart +
						encryptedContent[1] +
						commentCdataEscapeSequenceEnd +
						`</script>`
					: '') +
				(hint
					? `<script type="application/json" id="${xmlEscapeAttr(CMS_HINT_ELEMENT_ID_)}">` +
						commentCdataEscapeSequenceStart +
						xmlEscapeJsonScriptCdata(JSON.stringify(hint)) +
						commentCdataEscapeSequenceEnd +
						`</script>`
					: '')
			: '') +
		'</head>' +
		'<body>' +
		'<div id="ROOT_ELEMENT__">' +
		'<div id="FALLBACK_CONTENT_ELEMENT__">' +
		'<noscript>' +
		'<div id="NOSCRIPT_WARNING_CONTAINER_ELEMENT__">' +
		'<div id="NOSCRIPT_WARNING_TEXT_CONTAINER_ELEMENT__">' +
		'<p id="NOSCRIPT_WARNING_TEXT_ELEMENT__" lang="en" xml:lang="en">' +
		'Scripting must be enabled to use this application.' +
		'</p>' +
		'</div>' +
		'</div>' +
		'</noscript>' +
		'<div id="LOADING_ELEMENT__">' +
		'<div id="LOADING_ANIMATION_ELEMENT__"></div>' +
		'<p id="LOADING_TEXT_ELEMENT__" lang="en" xml:lang="en">Loading</p>' +
		'</div>' +
		'</div>' +
		'</div>' +
		`<div id="${xmlEscapeAttr(ERROR_ELEMENT_ID_)}">` +
		'<div id="ERROR_WARNING_CONTAINER_ELEMENT__">' +
		'<div id="ERROR_WARNING_TEXT_CONTAINER_ELEMENT__">' +
		'<p id="ERROR_WARNING_TEXT_ELEMENT__" lang="en" xml:lang="en">' +
		'An error occurred' +
		'</p>' +
		'</div>' +
		'</div>' +
		'</div>' +
		'</body>' +
		'</html>' +
		'\r\n'
	);
};

export default generateHtml_;
