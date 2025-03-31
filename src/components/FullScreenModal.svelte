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
	import { STRING__MODAL_CLOSE_ } from '~/i18n/strings.js';

	let dismissable_: boolean | null | undefined = false;
	let open_: boolean | null | undefined = true;

	export { dismissable_ as dismissable, open_ as open };
</script>

<dialog on:close open={open_ || null}>
	<div>
		<div>
			{#if dismissable_}
				<form method="dialog" action="about:blank">
					<button type="submit">
						<span class="sr-only">{STRING__MODAL_CLOSE_}</span>
					</button>
				</form>
			{/if}
			<slot></slot>
		</div>
	</div>
</dialog>

<style lang="postcss">
	dialog[open] {
		display: block;
		position: absolute;
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		width: 100%;
		height: 100%;
		z-index: 9999;
		background-color: rgba(0, 0, 0, 40%);
	}

	dialog > div {
		display: flex;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background-color: #f2f0f0;
		color: #333;
		border-radius: 1em;
		max-height: 80%;
		max-width: 80%;
		overflow: hidden;
	}

	dialog > div > div {
		display: block;
		margin: 2em 1em 1em;
		padding: 0 1em;
		overflow: auto;
	}

	dialog > div > div {
		margin-inline: 1em;
		margin-block: 2em 1em;
		padding-inline: 1em;
		padding-block: 0;
	}

	form {
		display: block;
		width: auto;
		height: 0;
	}

	form {
		inline-size: auto;
		block-size: 0;
	}

	button::before {
		content: '\2715';
		display: block;
		position: absolute;
		transform: translate(-50%, 50%);
		/* These don't depend on the writing mode */
		top: 0;
		right: 0;
		bottom: auto;
		left: auto;
		line-height: 1;
		cursor: pointer;
	}

	/* macOS: place close button to the left */
	@supports (-webkit-font-smoothing: auto) or (-moz-osx-font-smoothing: auto) {
		button::before {
			/* These don't depend on the writing mode */
			right: auto;
			left: 1em;
		}
	}
</style>
