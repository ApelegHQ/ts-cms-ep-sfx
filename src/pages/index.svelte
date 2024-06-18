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
	import Disclaimer from '~/components/Disclaimer.svelte';
	import Footer from '~/components/Footer.svelte';
	import Header from '~/components/Header.svelte';
	import Decrypt from './decrypt.svelte';
	import Encrypt from './encrypt.svelte';

	const hasCmsData = (() => {
		const cmsData$ = document.getElementById('CMS_DATA_ELEMENT__');
		if (cmsData$ && cmsData$ instanceof HTMLScriptElement) {
			return true;
		} else {
			return false;
		}
	})();
</script>

<Header />
{#if hasCmsData}
	<Decrypt />
{:else}
	<Encrypt />
{/if}
<Disclaimer />
<Footer />
