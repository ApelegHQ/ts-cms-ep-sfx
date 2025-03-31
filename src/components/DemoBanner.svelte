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
		STRING__ARIA_LABEL_TESTING_MODE_BANNER_,
		STRING__TESTING_MODE_,
	} from '~/i18n/strings.js';
	import isCI from '~/lib/isCI.js';
</script>

{#if isCI}
	<aside aria-label={STRING__ARIA_LABEL_TESTING_MODE_BANNER_}>
		<div>
			<p>{STRING__TESTING_MODE_}</p>
		</div>
	</aside>
{/if}

<style lang="postcss">
	aside {
		width: 100%;
		height: auto;
		font-size: 1.2em;
		background-color: #f00;
		color: #fff;
		border: 1px solid #600;
		font-weight: bold;
		user-select: none;
		pointer-events: none;
	}

	aside {
		inline-size: 100%;
		block-size: auto;
	}

	div {
		display: block;
		width: 100%;
		height: auto;
		max-width: 800px;
		max-height: none;
		margin: 0.5em auto;
		text-align: center;
	}

	div {
		inline-size: 100%;
		inline-block: auto;
		max-inline-size: 800px;
		max-block-size: none;
		margin-inline: auto;
		margin-block: 0.5em;
	}
</style>
