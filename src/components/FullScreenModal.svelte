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
	import './FullScreenModal.css';

	let dismissable_: boolean | null | undefined = false;
	let open_: boolean | null | undefined = true;

	export { dismissable_ as dismissable, open_ as open };
</script>

<dialog on:close class="fullscreenmodal" open={open_ || null}>
	<div class="fullscreenmodal-inner">
		<div class="fullscreenmodal-inner-inner">
			{#if dismissable_}
				<form
					class="fullscreenmodal-form"
					method="dialog"
					action="about:blank"
				>
					<button class="fullscreenmodal-dismiss" type="submit">
						<span class="sr-only">Close</span>
					</button>
				</form>
			{/if}
			<slot></slot>
		</div>
	</div>
</dialog>
