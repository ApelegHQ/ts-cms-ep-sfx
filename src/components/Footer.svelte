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
		gitCommitHash_ as gitCommitHash,
		packageHomepage_ as packageHomepage,
		packageRepository_ as packageRepository,
		packageName_ as packageName,
		packageVersion_ as packageVersion,
	} from '~/lib/packageInfo.js';
	import './Footer.css';
	import Logo from './Logo.svelte';

	const repository = (() => {
		if (!packageRepository) {
			return;
		}
		const url =
			typeof packageRepository === 'string'
				? packageRepository
				: packageRepository.url;

		return url.replace(/^git\+/, '');
	})();
</script>

<footer class="footer">
	<div class="footer-inner">
		<aside class="footer-attribution" lang="en">
			Made with &#x2764;&#xfe0f; by <Logo />
		</aside>
		<p class="footer-copyright" lang="en">
			© <data value="2024">ⅯⅯⅩⅩⅠⅤ</data> Apeleg Limited. All rights reserved.
		</p>
		{#if packageName}
			<ul class="footer-package-info" lang="en">
				<li>
					Build information:{' '}
					{packageName}
					{#if packageVersion}{' '}v{packageVersion}{/if}
					{#if gitCommitHash}
						{' '}(<data lang="zxx" value={gitCommitHash}
							>{gitCommitHash.slice(0, 7)}</data
						>)
					{/if}
				</li>

				{#if packageHomepage}
					<li>
						<a
							href={packageHomepage}
							rel="me external noopener noreferrer"
							target="_blank"
						>
							Home
						</a>
					</li>
				{/if}
				{#if repository}
					<li>
						<a
							href={repository}
							rel="me external noopener noreferrer"
							target="_blank"
						>
							Source
						</a>
					</li>
				{/if}
			</ul>
		{/if}
	</div>
</footer>
