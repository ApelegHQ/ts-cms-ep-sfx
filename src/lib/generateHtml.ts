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
} from './elementIds.js';
import {
	xmlEscape_ as xmlEscape,
	xmlEscapeAttr_ as xmlEscapeAttr,
	xmlEscapeJsonScriptCdata_ as xmlEscapeJsonScriptCdata,
} from './xmlEscape.js';

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

const generateHtml_ = async (
	mainScriptText: AllowSharedBufferSource,
	cssText: AllowSharedBufferSource,
	encryptedContent?: string[],
	hint?: string,
) => {
	const pkcs7MimeType = 'application/pkcs7-mime';
	const startJsonEscapeSequece = '<![CDATA[><!--\r\n';
	const endJsonEscapeSequece = '\r\n--><!]]>';

	const mainScriptTextSriDigest = await sriDigest(mainScriptText);
	const cssTextSriDigest = cssText ? await sriDigest(cssText) : '';

	if (hint) {
		hint = hint.replace(/<\//g, '<//');
	}

	return (
		'<!DOCTYPE html>' +
		'<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">' +
		'<head>' +
		'<meta charset="UTF-8"/>' +
		'<meta name="viewport" content="width=device-width, initial-scale=1.0"/>' +
		'<meta' +
		' http-equiv="content-security-policy"' +
		// Safari / WebKit seem to require frame-ancestors 'self' for starting
		// sandboxes
		` content="default-src 'none'; script-src 'self' 'unsafe-eval' blob: data:; script-src-elem blob: data: '${fallbackMessage.sri}' '${loader.sri}' '${mainScriptTextSriDigest}'; script-src-attr 'none'; style-src data: '${cssTextSriDigest}'; child-src blob:; connect-src blob: data:; frame-src blob:; worker-src blob:; frame-ancestors 'self'; form-action data:"` +
		'/>' +
		`<title>HTML CMS Tool</title>` +
		`<script src="data:text/javascript;base64,${xmlEscapeAttr(fallbackMessage.contentBase64)}" integrity="${xmlEscapeAttr(fallbackMessage.sri)}" crossorigin="anonymous">` +
		`</script>` +
		'\r\n' +
		`<script type="text/plain" data-integrity="${xmlEscapeAttr(mainScriptTextSriDigest)}" id="${xmlEscapeAttr(MAIN_SCRIPT_SRC_ELEMENT_ID_)}">\r\n` +
		xmlEscape(chunkString(bbtoa(mainScriptText), 512).join('\r\n')) +
		`</script>` +
		'\r\n' +
		`<link rel="stylesheet" href="data:text/css;base64,${xmlEscapeAttr(bbtoa(cssText))}" crossorigin="anonymous" integrity="${xmlEscapeAttr(cssTextSriDigest)}" id="${xmlEscapeAttr(MAIN_STYLESHEET_ELEMENT_ID_)}"/>` +
		'\r\n' +
		`<script src="data:text/javascript;base64,${xmlEscapeAttr(loader.contentBase64)}" defer="defer" integrity="${xmlEscapeAttr(loader.sri)}" crossorigin="anonymous">` +
		'</script>' +
		'\r\n' +
		(Array.isArray(encryptedContent) && encryptedContent.length > 1
			? `<script type="${xmlEscapeAttr(pkcs7MimeType)}" id="${xmlEscapeAttr(CMS_DATA_ELEMENT_ID_)}">` +
				startJsonEscapeSequece +
				encryptedContent[0] +
				endJsonEscapeSequece +
				`</script>` +
				(encryptedContent[1]
					? `<script type="${xmlEscapeAttr(pkcs7MimeType)}" id="${xmlEscapeAttr(CMS_FILENAME_ELEMENT_ID_)}">` +
						startJsonEscapeSequece +
						encryptedContent[1] +
						endJsonEscapeSequece +
						`</script>`
					: '') +
				(hint
					? `<script type="application/json" id="${xmlEscapeAttr(CMS_HINT_ELEMENT_ID_)}">` +
						startJsonEscapeSequece +
						xmlEscapeJsonScriptCdata(JSON.stringify(hint)) +
						endJsonEscapeSequece +
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
