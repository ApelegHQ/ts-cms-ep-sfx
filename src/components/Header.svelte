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
	import './Header.css';
	import OfflineDownload from './OfflineDownload.svelte';

	let mainScript$_: HTMLScriptElement | undefined;
	let mainStylesheet$_: HTMLLinkElement | undefined;
	let openPgpSignature$_: HTMLScriptElement | undefined;

	export {
		mainScript$_ as mainScript$,
		mainStylesheet$_ as mainStylesheet$,
		openPgpSignature$_ as openPgpSignature$,
	};
</script>

<header class="header">
	<div class="header-inner">
		<h1 class="header-title">
			HTML&#x2010;based file encryption and decryption utility
		</h1>
		<OfflineDownload
			mainScript$={mainScript$_}
			mainStylesheet$={mainStylesheet$_}
			openPgpSignature$={openPgpSignature$_}
		/>
	</div>
</header>
