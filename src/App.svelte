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
	import Index from './pages/index.svelte';
</script>

<div class="app-container">
	<Index />
</div>

<style lang="postcss" global>
	@import url(./App.css);

	@tailwind base;
	@tailwind components;
	@tailwind utilities;

	/* Needed to make footer stick to the bottom */
	.app-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
</style>
