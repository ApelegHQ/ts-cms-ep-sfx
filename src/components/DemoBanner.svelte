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
	import isCI from '~/lib/isCI.js';
	import './DemoBanner.css';
</script>

{#if isCI}
	<aside aria-label="Testing mode banner" class="demo-banner" lang="en">
		<div class="demo-banner-inner">
			<p>&#x26a0;&#xfe0f; Testing mode &#x26a0;&#xfe0f;</p>
		</div>
	</aside>
{/if}
