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
	import SkipToMainContent from '~/components/SkipToMainContent.svelte';
	import { STRING__TITLE_HTML_BASED_FILE_UTILITY_ } from '~/i18n/strings.js';
	import OfflineDownload from './OfflineDownload.svelte';

	let expand$_: boolean;
	let mainScript$_: HTMLScriptElement | undefined;
	let mainStylesheet$_: HTMLLinkElement | undefined;
	let openPgpSignature$_: HTMLScriptElement | undefined;

	export {
		expand$_ as expand$,
		mainScript$_ as mainScript$,
		mainStylesheet$_ as mainStylesheet$,
		openPgpSignature$_ as openPgpSignature$,
	};
</script>

<header>
	<SkipToMainContent />
	<div>
		<h1>{STRING__TITLE_HTML_BASED_FILE_UTILITY_}</h1>
		<OfflineDownload
			expand$={expand$_}
			mainScript$={mainScript$_}
			mainStylesheet$={mainStylesheet$_}
			openPgpSignature$={openPgpSignature$_}
		/>
	</div>
</header>

<style lang="postcss">
	header {
		width: 100%;
		padding: 1em;
		background-color: #fff;
		color: #333;
	}

	div {
		display: block;
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
	}

	h1 {
		font-size: 1.8em;
		font-weight: bold;
		text-transform: uppercase;
		margin: 0 0 0.5em 0;
		margin-inline: 0;
		margin-block: 0 0.5em;
		display: inline;
	}
</style>
