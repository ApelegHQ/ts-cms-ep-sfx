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
	const labelId =
		'disclaimer-title-' + (0, Math.random)().toFixed(6).slice(2);
</script>

<aside aria-labelledby={labelId} lang="en">
	<div>
		<h2 id={labelId}>Warranty disclaimer</h2>
		<p>
			To the extent permissible by applicable law, the Software is
			provided &#x201c;as is&#x201d;, without warranty of any kind,
			express or implied, including but not limited to the warranties of
			merchantability, fitness for a particular purpose and
			noninfringement. Except as required by applicable law, in no event
			shall the authors or copyright holders be liable for any claim,
			damages or other liability, whether in an action of contract, tort
			or otherwise, arising from, out of or in connection with the
			Software or the use or other dealings in the Software.
		</p>
	</div>
</aside>

<style lang="postcss">
	aside {
		width: 100%;
		font-size: 0.8em;
		padding: 1em;
		background-color: #fff;
		color: #333;
	}

	div {
		display: block;
		width: 100%;
		max-width: 800px;
		margin: 1em auto;
		border: 0.5em solid currentColor;
		padding: 1em;
	}

	h2 {
		font-size: 1.5em;
		font-weight: bold;
		text-transform: uppercase;
		margin-bottom: 0.5em;
	}

	p {
		font-style: italic;
	}
</style>
