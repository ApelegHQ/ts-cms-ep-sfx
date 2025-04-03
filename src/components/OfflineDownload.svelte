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
	import {
		STRING__BUTTON_DOWNLOAD_OFFLINE_USE_,
		STRING__BUTTON_DOWNLOAD_OFFLINE_USE_EXPAND_,
	} from '~/i18n/strings.js';
	import { SR_ONLY_CLASSNAME_ } from '~/lib/classNames.js';
	import downloadArchive from '~/lib/downloadArchive.js';

	let mainScript$_: HTMLScriptElement | undefined;
	let mainStylesheet$_: HTMLLinkElement | undefined;
	let openPgpSignature$_: HTMLScriptElement | undefined;
	let expand$_: boolean = true;

	const handleClick = () => {
		if (expand$_) {
			expand$_ = false;
			return;
		}

		downloadArchive(
			mainScript$_!,
			mainStylesheet$_!,
			openPgpSignature$_!,
			'encrypt.html',
		);
	};

	export {
		expand$_ as expand$,
		mainScript$_ as mainScript$,
		mainStylesheet$_ as mainStylesheet$,
		openPgpSignature$_ as openPgpSignature$,
	};
</script>

{#if mainScript$_ && mainStylesheet$_ && openPgpSignature$_}
	<button on:click={handleClick}
		>{#if expand$_}
			<span role="img"
				>{STRING__BUTTON_DOWNLOAD_OFFLINE_USE_EXPAND_[0]}</span
			><span class={SR_ONLY_CLASSNAME_}
				>{STRING__BUTTON_DOWNLOAD_OFFLINE_USE_EXPAND_[1]}</span
			>
		{:else}
			{STRING__BUTTON_DOWNLOAD_OFFLINE_USE_}
		{/if}</button
	>
{/if}

<style lang="postcss">
	* {
		display: block;
		padding: 0.4em;
		margin: 0.5em;
		float: right;
		font-size: 0.8em;
		text-transform: uppercase;
		cursor: pointer;
		border: 2px solid currentColor;
		color: #a26135;
		background-color: white;
		user-select: none;
	}
</style>
