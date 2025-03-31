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
		STRING__TITLE_WARRANTY_DISCLAIMER_,
		STRING__WARANTY_DISCLAIMER_TEXT_,
	} from '~/i18n/strings.js';

	const labelId =
		'disclaimer-title-' + (0, Math.random)().toFixed(6).slice(2);
</script>

<aside aria-labelledby={labelId}>
	<div>
		<h2 lang={STRING__TITLE_WARRANTY_DISCLAIMER_[0]} id={labelId}>
			{STRING__TITLE_WARRANTY_DISCLAIMER_[1]}
		</h2>
		<p lang={STRING__WARANTY_DISCLAIMER_TEXT_[0]}>
			{STRING__WARANTY_DISCLAIMER_TEXT_[1]}
		</p>
	</div>
</aside>

<style lang="postcss">
	aside {
		width: 100%;
		height: auto;
		font-size: 0.8em;
		padding: 1em;
		background-color: #fff;
		color: #333;
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
		margin: 1em auto;
		border: 0.5em solid currentColor;
		padding: 1em;
	}

	div {
		inline-size: 100%;
		block-size: auto;
		max-inline-size: 800px;
		max-block-size: none;
		margin-inline: auto;
		margin-block: 1em;
	}

	h2 {
		font-size: 1.5em;
		font-weight: bold;
		text-transform: uppercase;
		margin: 0 0 0.5em 0;
	}

	h2 {
		margin-inline: 0;
		margin-block: 0 0.5em;
	}

	p {
		font-style: italic;
	}
</style>
