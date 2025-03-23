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
	import downloadArchive from '~/lib/downloadArchive.js';

	let mainScript$_: HTMLScriptElement | undefined;
	let mainStylesheet$_: HTMLLinkElement | undefined;
	let openPgpSignature$_: HTMLScriptElement | undefined;

	const handleClick = () => {
		downloadArchive(
			mainScript$_!,
			mainStylesheet$_!,
			openPgpSignature$_!,
			'encrypt.html',
		);
	};

	export {
		mainScript$_ as mainScript$,
		mainStylesheet$_ as mainStylesheet$,
		openPgpSignature$_ as openPgpSignature$,
	};
</script>

{#if mainScript$_ && mainStylesheet$_ && openPgpSignature$_}
	<button on:click={handleClick}
		>&#x2b07;&#xfe0e; Download for offline use</button
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
