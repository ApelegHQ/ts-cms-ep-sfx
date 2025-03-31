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
	import { STRING__SKIP_TO_MAIN_CONTENT_ } from '~/i18n/strings.js';
	import { MAIN_CONTENT_ELEMENT_ID_ } from '~/lib/elementIds.js';
</script>

<a href={'#' + MAIN_CONTENT_ELEMENT_ID_}>{STRING__SKIP_TO_MAIN_CONTENT_}</a>

<style lang="postcss">
	* {
		background-color: #f2f0f0;
		color: #333;
		border: 2px solid #a26135;
		display: block;
		font-size: 1em;
		line-height: 1.5em;
		margin: -50em 0.75em 0.75em;
		padding: 0.75em;
		position: absolute;
		transition-duration: 0.15s;
		transition-property: all;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		z-index: 10;
	}

	:focus {
		margin-top: 0.75rem;
	}
</style>
