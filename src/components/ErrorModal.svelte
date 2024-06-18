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
	import FullScreenModal from './FullScreenModal.svelte';
	import './ErrorModal.css';

	let error_: unknown;
	let dismissable_: boolean | null | undefined = false;

	export { error_ as error, dismissable_ as dismissable };
</script>

<FullScreenModal dismissable={dismissable_}>
	<div class="errormodal-icon">&#x1f645;&#xfe0e;</div>
	<details>
		<summary class="errormodal-text">An error occurred</summary>
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
