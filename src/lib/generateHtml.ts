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
import {
	LANG_CODE_,
	LANG_DIR_,
	STRING__ALTERNATE_DECRYPTION_INSTRUCTIONS_COMMAND_,
	STRING__ERROR_AN_ERROR_OCCURRED_,
	STRING__ERROR_SCRIPTING_MUST_BE_ENABLED_,
	STRING__EXAMPLE_COMMAND_OUTPUT_FILE_NAME_,
	STRING__EXAMPLE_COMMAND_SOMEPASSWORD_,
	STRING__EXAMPLE_COMMAND_THIS_FILE_NAME_,
	STRING__LOADING_,
	STRING__TITLE_HTML_CMS_TOOL_,
} from '~/i18n/strings.js';
import {
	gitCommitHash_ as gitCommitHash,
	packageName_ as packageName,
	packageVersion_ as packageVersion,
} from '~/lib/packageInfo.js';
import chunkString from './chunkString.js';
import {
	commentCdataEscapeSequenceEnd_ as commentCdataEscapeSequenceEnd,
	commentCdataEscapeSequenceStart_ as commentCdataEscapeSequenceStart,
} from './commentCdataEscapeSequence.js';
import {
	CMS_DATA_ELEMENT_ID_,
	CMS_HINT_ELEMENT_ID_,
	ERROR_ELEMENT_ID_,
	ERROR_WARNING_CONTAINER_ELEMENT_ID_,
	ERROR_WARNING_TEXT_CONTAINER_ELEMENT_ID_,
	ERROR_WARNING_TEXT_ELEMENT_ID_,
	FALLBACK_CONTENT_ELEMENT_ID_,
	LOADING_ANIMATION_ELEMENT_ID_,
	LOADING_ELEMENT_ID_,
	LOADING_TEXT_ELEMENT_ID_,
	MAIN_SCRIPT_SRC_ELEMENT_ID_,
	MAIN_STYLESHEET_ELEMENT_ID_,
	NOSCRIPT_WARNING_CONTAINER_ELEMENT_ID_,
	NOSCRIPT_WARNING_TEXT_CONTAINER_ELEMENT_ID_,
	NOSCRIPT_WARNING_TEXT_ELEMENT_ID_,
	OPENPGP_SIGNATURE_ELEMENT_ID_,
	ROOT_ELEMENT_ID_,
} from './elementIds.js';
import sharedBufferToUint8Array from './sharedBufferToUint8Array.js';
import {
	xmlEscape_ as xmlEscape,
	xmlEscapeAttr_ as xmlEscapeAttr,
	xmlEscapeJsonScriptCdata_ as xmlEscapeJsonScriptCdata,
} from './xmlEscape.js';

const bbtoa = (buf: AllowSharedBufferSource) => {
	const u8buf = sharedBufferToUint8Array(buf);

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
		`${packageName} v${packageVersion || '*'}; revision ${gitCommitHash || '*'}` +
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
		`<title>${xmlEscape(STRING__TITLE_HTML_CMS_TOOL_)}</title>` +
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

const generateBody_ = (fallback?: number) => {
	return (
		'<body>' +
		`<div id="${xmlEscapeAttr(ERROR_ELEMENT_ID_)}">` +
		`<div id="${xmlEscapeAttr(ERROR_WARNING_CONTAINER_ELEMENT_ID_)}">` +
		`<div id="${xmlEscapeAttr(ERROR_WARNING_TEXT_CONTAINER_ELEMENT_ID_)}">` +
		`<p id="${xmlEscapeAttr(ERROR_WARNING_TEXT_ELEMENT_ID_)}">` +
		xmlEscape(STRING__ERROR_AN_ERROR_OCCURRED_) +
		'</p>' +
		'</div>' +
		'</div>' +
		'</div>' +
		`<div id="${xmlEscapeAttr(ROOT_ELEMENT_ID_)}">` +
		`<div id="${xmlEscapeAttr(FALLBACK_CONTENT_ELEMENT_ID_)}">` +
		(fallback
			? '<noscript>' +
				`<div id="${xmlEscapeAttr(NOSCRIPT_WARNING_CONTAINER_ELEMENT_ID_)}">` +
				`<div id="${xmlEscapeAttr(NOSCRIPT_WARNING_TEXT_CONTAINER_ELEMENT_ID_)}">` +
				`<p id="${xmlEscapeAttr(NOSCRIPT_WARNING_TEXT_ELEMENT_ID_)}">` +
				xmlEscape(STRING__ERROR_SCRIPTING_MUST_BE_ENABLED_) +
				'</p>' +
				(fallback > 1
					? '<p>' +
						xmlEscape(
							STRING__ALTERNATE_DECRYPTION_INSTRUCTIONS_COMMAND_,
						) +
						'</p>' +
						'<pre><code>' +
						'<b>openssl</b> cms -decrypt -pwri_password <var>' +
						xmlEscape(STRING__EXAMPLE_COMMAND_SOMEPASSWORD_) +
						'</var> -inform PEM -in <var>' +
						xmlEscape(STRING__EXAMPLE_COMMAND_THIS_FILE_NAME_) +
						'</var> -out <var>' +
						xmlEscape(STRING__EXAMPLE_COMMAND_OUTPUT_FILE_NAME_) +
						'</var>' +
						'</code></pre>'
					: '') +
				'</div>' +
				'</div>' +
				'</noscript>'
			: '') +
		`<div id="${xmlEscapeAttr(LOADING_ELEMENT_ID_)}">` +
		`<div id="${xmlEscapeAttr(LOADING_ANIMATION_ELEMENT_ID_)}"></div>` +
		`<p id="${xmlEscapeAttr(LOADING_TEXT_ELEMENT_ID_)}">` +
		xmlEscape(STRING__LOADING_) +
		'</p>' +
		'</div>' +
		'</div>' +
		'</div>' +
		'</body>'
	);
};

const generateHtml_ = async (
	mainScriptText: AllowSharedBufferSource,
	cssText: AllowSharedBufferSource,
	openPgpSignatureText?: string | null | undefined,
	encryptedContent?: string,
	hint?: string,
) => {
	const pkcs7MimeType = 'application/pkcs7-mime';

	const tbsPayload = await tbsPayload_(mainScriptText, cssText);

	if (hint) {
		hint = hint.replace(/<\//g, '<//');
	}

	return (
		'<!DOCTYPE html>' +
		`<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${xmlEscapeAttr(LANG_CODE_)}" lang="${xmlEscapeAttr(LANG_CODE_)}" dir="${xmlEscapeAttr(LANG_DIR_)}">` +
		'<head>' +
		(openPgpSignatureText
			? openPgpSignatureWrapper(tbsPayload, openPgpSignatureText)
			: '<script type="text/plain">' +
				commentCdataEscapeSequenceStart +
				tbsPayload +
				commentCdataEscapeSequenceEnd +
				'</script>') +
		(encryptedContent
			? `<script type="${xmlEscapeAttr(pkcs7MimeType)}" id="${xmlEscapeAttr(CMS_DATA_ELEMENT_ID_)}">` +
				commentCdataEscapeSequenceStart +
				encryptedContent +
				commentCdataEscapeSequenceEnd +
				`</script>` +
				(hint
					? `<script type="application/json" id="${xmlEscapeAttr(CMS_HINT_ELEMENT_ID_)}">` +
						commentCdataEscapeSequenceStart +
						xmlEscapeJsonScriptCdata(JSON.stringify(hint)) +
						commentCdataEscapeSequenceEnd +
						`</script>`
					: '')
			: '') +
		'</head>' +
		generateBody_(encryptedContent ? 2 : 1) +
		'</html>' +
		'\r\n'
	);
};

export default generateHtml_;
export { generateBody_ };
