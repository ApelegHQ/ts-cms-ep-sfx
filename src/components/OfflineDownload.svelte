<!--
 * Copyright © 2023 Exact Realty Limited. All rights reserved.
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
	import './OfflineDownload.css';

	let mainScript$_: HTMLScriptElement | undefined;
	let mainStylesheet$_: HTMLLinkElement | undefined;

	const handleClick = () => {
		downloadArchive(mainScript$_!, mainStylesheet$_!, 'encrypt.html');
	};

	export { mainScript$_ as mainScript$, mainStylesheet$_ as mainStylesheet$ };
</script>

{#if mainScript$_ && mainStylesheet$_}
	<button on:click={handleClick} class="offline-download-button"
		>&#x2b07;&#xfe0e; Download for offline use</button
	>
{/if}
