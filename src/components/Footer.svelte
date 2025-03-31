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
		STRING__ARIA_LABEL_ATTRIBUTION_,
		STRING__BUILD_INFORMATION_VERSION_,
		STRING__COPYRIGHT_YEAR_ALL_RIGHTS_RESERVED_,
		STRING__FOOTER_HOME_LINK_,
		STRING__FOOTER_SOURCE_CODE_LINK_,
		STRING__MADE_WITH_LOVE_BY_,
	} from '~/i18n/strings.js';
	import {
		gitCommitHash_ as gitCommitHash,
		packageHomepage_ as packageHomepage,
		packageName_ as packageName,
		packageRepository_ as packageRepository,
		packageVersion_ as packageVersion,
	} from '~/lib/packageInfo.js';
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

<footer>
	<div>
		<aside aria-label={STRING__ARIA_LABEL_ATTRIBUTION_}>
			{STRING__MADE_WITH_LOVE_BY_[0]}<Logo
			/>{STRING__MADE_WITH_LOVE_BY_[1]}
		</aside>
		<p>
			{STRING__COPYRIGHT_YEAR_ALL_RIGHTS_RESERVED_[0]}<time
				datetime="2025">ⅯⅯⅩⅩⅤ</time
			>{STRING__COPYRIGHT_YEAR_ALL_RIGHTS_RESERVED_[1]}
		</p>
		{#if packageName}
			<ul>
				<li>
					{STRING__BUILD_INFORMATION_VERSION_[0]}
					{packageName}
					{#if packageVersion}{STRING__BUILD_INFORMATION_VERSION_[1]}v{packageVersion}{/if}
					{#if gitCommitHash}
						{STRING__BUILD_INFORMATION_VERSION_[2]}(<data
							lang="zxx"
							value={gitCommitHash}
							>{gitCommitHash.slice(0, 7)}</data
						>)
					{/if}
					{STRING__BUILD_INFORMATION_VERSION_[3]}
				</li>

				{#if packageHomepage}
					<li>
						<a
							href={packageHomepage}
							rel="me external noopener noreferrer"
							target="_blank">{STRING__FOOTER_HOME_LINK_}</a
						>
					</li>
				{/if}
				{#if repository}
					<li>
						<a
							href={repository}
							rel="me external noopener noreferrer"
							target="_blank"
							>{STRING__FOOTER_SOURCE_CODE_LINK_}</a
						>
					</li>
				{/if}
			</ul>
		{/if}
	</div>
</footer>

<style lang="postcss">
	footer {
		width: 100%;
		height: auto;
		font-size: 0.7em;
		padding: 1em;
		background-color: rgb(67, 28, 1);
		color: white;
	}

	footer {
		inline-size: 100%;
		block-size: auto;
	}

	div {
		display: block;
		width: 100%;
		height: auto;
		max-width: 800px;
		max-height: none;
		margin: 0 auto;
	}

	div {
		inline-size: 100%;
		block-size: auto;
		max-inline-size: 800px;
		max-block-size: none;
		margin-inline: auto;
		margin-block: 0;
	}

	aside {
		display: block;
		text-align: right;
	}

	aside :global(svg) {
		display: inline;
		height: 4em;
		width: auto;
		user-select: none;
		/* Writing mode independent for this element */
		transform: translateY(-0.25em);
	}

	p {
		display: block;
		text-align: center;
	}

	ul {
		display: block;
		text-align: center;
		font-size: 0.85em;
		font-style: italic;
	}

	ul li {
		display: inline;
	}

	ul li + li::before {
		content: ' | ';
		font-style: normal;
	}

	ul a {
		text-decoration: underline;
	}
</style>
