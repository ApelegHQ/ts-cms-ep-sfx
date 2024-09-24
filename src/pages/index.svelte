<!--
 * Copyright © 2023 Apeleg Limited. All rights reserved.
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
-->

<script lang="typescript">
	import DemoBanner from '~/components/DemoBanner.svelte';
	import Disclaimer from '~/components/Disclaimer.svelte';
	import Footer from '~/components/Footer.svelte';
	import Header from '~/components/Header.svelte';
	import {
		CMS_DATA_ELEMENT_ID_,
		MAIN_SCRIPT_ELEMENT_ID_,
		MAIN_STYLESHEET_ELEMENT_ID_,
		OPENPGP_SIGNATURE_ELEMENT_ID_,
	} from '~/lib/elementIds.js';
	import Decrypt from './decrypt.svelte';
	import Encrypt from './encrypt.svelte';

	const [mainScript$, mainStylesheet$, openPgpSignature$] = (():
		| [HTMLScriptElement, HTMLLinkElement, HTMLScriptElement]
		| [] => {
		const _mainScript$ = document.getElementById(MAIN_SCRIPT_ELEMENT_ID_);
		const _mainStylesheet$ = document.getElementById(
			MAIN_STYLESHEET_ELEMENT_ID_,
		);
		const _openPgpSignature$ = document.getElementById(
			OPENPGP_SIGNATURE_ELEMENT_ID_,
		);
		if (
			!_mainScript$ ||
			!(_mainScript$ instanceof HTMLScriptElement) ||
			!_mainStylesheet$ ||
			!(_mainStylesheet$ instanceof HTMLLinkElement) ||
			!_openPgpSignature$ ||
			!(_openPgpSignature$ instanceof HTMLScriptElement)
		) {
			return [];
		}

		return [_mainScript$, _mainStylesheet$, _openPgpSignature$];
	})();

	const hasCmsData = (() => {
		const cmsData$ = document.getElementById(CMS_DATA_ELEMENT_ID_);
		if (cmsData$ && cmsData$ instanceof HTMLScriptElement) {
			return true;
		} else {
			return false;
		}
	})();
</script>

<DemoBanner />
<Header {mainScript$} {mainStylesheet$} {openPgpSignature$} />
{#if hasCmsData}
	<Decrypt />
{:else}
	<Encrypt {mainScript$} {mainStylesheet$} {openPgpSignature$} />
{/if}
<Disclaimer />
<Footer />
