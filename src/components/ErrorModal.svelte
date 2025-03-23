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
	import FullScreenModal from './FullScreenModal.svelte';

	let error_: unknown;
	let dismissable_: boolean | null | undefined = false;

	export { error_ as error, dismissable_ as dismissable };
</script>

<FullScreenModal dismissable={dismissable_}>
	<div class="errormodal-icon">&#x1f645;&#xfe0e;</div>
	<details>
		<summary>An error occurred</summary>
		<div>
			{#if error_ instanceof Error}
				<dl>
					<dt class="sr-only">Name</dt>
					<dd class="errormodal-errorname">
						{error_.name ?? '(unknown)'}
					</dd>
					{#if error_.message}
						<dt class="sr-only">Message</dt>
						<dd class="errormodal-message">{error_.message}</dd>
					{/if}
					{#if error_.stack}
						<dt class="sr-only">Stack</dt>
						<dd>
							<pre class="errormodal-stack">{error_.stack}</pre>
						</dd>
					{/if}
				</dl>
			{:else}
				<pre>{String(error_)}</pre>
			{/if}
		</div>
	</details>
</FullScreenModal>

<style lang="postcss">
	.errormodal-icon {
		font-size: 6em;
		color: #333;
		text-align: center;
	}

	summary {
		font-size: 1.5rem;
	}

	.errormodal-errorname {
		text-decoration: underline;
		font-weight: bold;
		display: inline;
	}

	.errormodal-message::before {
		content: ': ';
	}

	.errormodal-message {
		display: inline;
	}

	.errormodal-stack {
		margin: 0.5em auto;
		overflow: auto;
		max-width: 75vw;
	}
</style>
