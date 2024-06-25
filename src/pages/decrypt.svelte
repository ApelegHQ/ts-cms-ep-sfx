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
	import { onDestroy, onMount } from 'svelte';
	import ErrorModal from '~/components/ErrorModal.svelte';
	import HumanFileSize from '~/components/HumanFileSize.svelte';
	import Loading from '~/components/Loading.svelte';
	import EFormFields from '~/lib/EFormFields.js';
	import bufferEqual from '~/lib/bufferEqual.js';
	import cmsPemToDer from '~/lib/cmsPemToDer.js';
	import downloadBlob from '~/lib/downloadBlob.js';
	import {
		CMS_DATA_ELEMENT_ID_,
		CMS_FILENAME_ELEMENT_ID_,
		CMS_HINT_ELEMENT_ID_,
		MAIN_CONTENT_ELEMENT_ID_,
	} from '~/lib/elementIds.js';
	import isTrustedEvent from '~/lib/isTrustedEvent.js';
	import {
		fileDecryptionCms$SEP_,
		parseCmsData$SEP_,
	} from '~/lib/sandboxEntrypoints.js';
	import setupDecryptionSandbox from '~/lib/setupDecryptionSandbox.js';
	import setupParseCmsDataSandbox from '~/lib/setupParseCmsSandbox.js';
	import './common.css';
	import './decrypt.css';

	let initError: Error | undefined;
	let dataAttributes:
		| [
				salt: AllowSharedBufferSource,
				iterationCount: number,
				noncePWRI: AllowSharedBufferSource,
				encryptedKey: AllowSharedBufferSource,
				nonceECI: AllowSharedBufferSource,
				encryptedContent: AllowSharedBufferSource,
		  ]
		| undefined;
	let filenameAttributes:
		| [
				salt: AllowSharedBufferSource,
				iterationCount: number,
				noncePWRI: AllowSharedBufferSource,
				encryptedKey: AllowSharedBufferSource,
				nonceECI: AllowSharedBufferSource,
				encryptedContent: AllowSharedBufferSource,
		  ]
		| undefined;
	let hint: string | undefined;

	let sandbox: Awaited<ReturnType<typeof setupDecryptionSandbox>> | undefined;
	let abort: { (): void } | undefined;

	let instance: Record<never, never>;
	let working: boolean = false;
	let password: string | undefined;
	let blob: Blob | Error | undefined;
	let filename: string | undefined;
	let noFilename: boolean = false;

	const init = () => {
		instance = {};
		working = false;
		password = undefined;
		blob = undefined;
		filename = undefined;
		noFilename = false;
	};

	onMount(() => {
		const abortController = new AbortController();
		const _abort = () => {
			sandbox = undefined;
			abortController.abort(new Error('Component destroyed'));
		};
		abort = _abort;

		Promise.resolve()
			.then(async () => {
				const stage1AbortController = new AbortController();
				const abortHandler = () => stage1AbortController.abort();
				abortController.signal.addEventListener(
					'abort',
					abortHandler,
					false,
				);
				const cmsData$ = document.getElementById(CMS_DATA_ELEMENT_ID_);
				const cmsFilename$ = document.getElementById(
					CMS_FILENAME_ELEMENT_ID_,
				);
				const cmsHint$ = document.getElementById(CMS_HINT_ELEMENT_ID_);

				if (!cmsData$ || !(cmsData$ instanceof HTMLScriptElement)) {
					throw new Error('Invalid or nonexistent CMS data');
				}

				const sandbox = await setupParseCmsDataSandbox(
					stage1AbortController.signal,
				);

				try {
					dataAttributes = await sandbox(
						parseCmsData$SEP_,
						cmsPemToDer(cmsData$.text),
					);

					if (
						cmsFilename$ &&
						cmsFilename$ instanceof HTMLScriptElement
					) {
						try {
							filenameAttributes = await sandbox(
								parseCmsData$SEP_,
								cmsPemToDer(cmsFilename$.text),
							);

							if (
								filenameAttributes[1] !== dataAttributes[1] ||
								!bufferEqual(
									filenameAttributes[0],
									dataAttributes[0],
								)
							) {
								throw new Error(
									'Mismatched iterations count or salt',
								);
							}
						} catch (e) {
							console.warn('Error parsing filename CMS data', e);
						}
					} else {
						console.info('No filename present');
					}
				} catch (e) {
					const message = 'Error processing CMS payload';
					console.error(message, e);
					initError = new Error(message);
					throw initError;
				} finally {
					abortController.signal.removeEventListener(
						'abort',
						abortHandler,
						false,
					);
					stage1AbortController.abort();
				}

				if (cmsHint$ && cmsHint$ instanceof HTMLScriptElement) {
					// Delimiters look like:
					//   * start: `><!--` (XML) / `<![CDATA[><!--` (HTML)
					//   * end: `--><!` (XML) / `--><!]]>` (HTML)
					const hintText = cmsHint$.text;
					const matches = hintText.match(
						/^\s*(?:<!\[CDATA\[)?><!--([\S\s]*)--><!(?:]]>)?\s*$/,
					);
					if (matches) {
						try {
							const _hint = JSON.parse(matches[1]);
							if (typeof _hint === 'string') {
								hint = _hint;
							} else {
								console.warn(
									'Unexpected type for hint',
									typeof hint,
								);
							}
						} catch (e) {
							console.warn('Error parsing hint', e);
						}
					} else {
						console.warn('Unable to find hint start marker');
					}
				} else {
					console.info('No hint present');
				}
			})
			.then(async () => {
				try {
					const _sandbox = await setupDecryptionSandbox(
						() => {
							if (!password) {
								throw new Error('Invalid or missing password');
							}
							return password;
						},
						() => {
							if (!Array.isArray(dataAttributes)) {
								throw new Error(
									'Invalid or missing iterations count',
								);
							}
							return dataAttributes[1];
						},
						() => {
							if (!Array.isArray(dataAttributes)) {
								throw new Error('Invalid or missing salt');
							}
							return dataAttributes[0];
						},
						abortController.signal,
					);

					init();
					sandbox = _sandbox;
				} catch (e) {
					const message = 'Error preparing decryption sandbox';
					console.error(message, e);
					initError = new Error(message);
					throw initError;
				}
			})
			.catch((e) => {
				if (e !== initError) {
					const message = 'Error preparing sandbox';
					console.error(message, e);
					initError = new Error(message);
				}
				abortController.abort();
				abort = undefined;
			});
	});

	onDestroy(() => {
		if (typeof abort === 'function') {
			abort();
		}
	});

	const handleNoFilenameSelection = (e: Event) => {
		if (!isTrustedEvent(e)) return;

		const target = e.target;
		if (!target || !(target instanceof HTMLInputElement)) return;

		noFilename = target.checked;
	};

	const handleFormReset = (e: Event) => {
		if (!isTrustedEvent(e)) return;

		init();
	};

	const handleFormSubmit = (e: SubmitEvent) => {
		if (!isTrustedEvent(e)) return;
		if (working) return;

		const target = e.target;
		if (!target || !(target instanceof HTMLFormElement)) return;

		working = true;
		const _instance = instance;

		if (!(blob instanceof Blob)) {
			blob = undefined;

			(async () => {
				const formData = new FormData(target, e.submitter);

				const _password = (formData.get(EFormFields.PASSWORD) ??
					'') as unknown as string;
				password = _password;

				if (!Array.isArray(dataAttributes)) {
					throw new TypeError('attributes is not an array');
				}

				if (typeof sandbox !== 'function') {
					throw new TypeError('sandbox is not a function');
				}

				try {
					const [data, _filename] = await (filenameAttributes
						? sandbox(
								fileDecryptionCms$SEP_,
								dataAttributes[2],
								dataAttributes[3],
								dataAttributes[4],
								dataAttributes[5],
								filenameAttributes[2],
								filenameAttributes[3],
								filenameAttributes[4],
								filenameAttributes[5],
							)
						: sandbox(
								fileDecryptionCms$SEP_,
								dataAttributes[2],
								dataAttributes[3],
								dataAttributes[4],
								dataAttributes[5],
							));

					blob = new Blob([data], {
						['type']: 'application/octet-stream',
					});
					filename = _filename;
				} catch (e) {
					const message = 'Error decrypting file';
					console.error(message, e);
					blob = new Error(message);
				} finally {
					password = undefined;
				}
			})()
				.catch(() => {
					if (instance !== _instance) {
						return;
					}
				})
				.finally(() => {
					if (instance !== _instance) {
						return;
					}

					working = false;
				});
		} else {
			const formData = new FormData(target, e.submitter);
			const _noFilename = !!formData.get(EFormFields.NO_FILENAME);
			const _filename = (formData.get(EFormFields.FILENAME) ??
				'') as unknown as string;

			downloadBlob(
				blob,
				!_noFilename ? _filename || filename : undefined,
			);
			working = false;
		}
	};
</script>

<svelte:head>
	<title>Decrypt</title>
</svelte:head>
<main class="main" id={MAIN_CONTENT_ELEMENT_ID_}>
	{#if (!sandbox || !dataAttributes) && !initError}
		<Loading>Getting things ready</Loading>
	{:else if initError instanceof Error}
		<ErrorModal error={initError}></ErrorModal>
	{:else}
		{#if blob instanceof Error}
			<ErrorModal dismissable error={blob}></ErrorModal>
		{/if}
		{#if working}
			<Loading>Processing data&#x2026;</Loading>
		{/if}
		<div class="inner">
			<h2 class="page-title">Decrypt a file</h2>
			<form
				on:submit|preventDefault={handleFormSubmit}
				on:reset={handleFormReset}
				aria-busy={working ? 'true' : 'false'}
				action="#"
				method="POST"
				rel={blob instanceof Blob ? '' : 'next'}
			>
				{#if !(blob instanceof Blob)}
					<fieldset class="fieldset" disabled={working || null}>
						<legend class="sr-only">Password configuration</legend>
						<label class="label">
							<span>Password</span>
							<input
								name={EFormFields.PASSWORD}
								type="password"
								required
							/>
						</label>
					</fieldset>

					<details class="fieldset" open>
						<summary>Provided information</summary>
						<dl>
							{#if dataAttributes}
								<dt class="decrypt-detail-name">
									Approximate file size
								</dt>
								<dd class="decrypt-detail-value">
									<HumanFileSize
										value={dataAttributes[5].byteLength -
											16}
									/>
								</dd>
							{/if}
							{#if hint}
								<dt class="decrypt-detail-name">Hint</dt>
								<dd class="decrypt-detail-value">
									<pre>{hint}</pre>
								</dd>
							{/if}
						</dl>
					</details>
				{:else}
					<div class="decrypt-success">
						&#x2705;&#xfe0f; File successfully decrypted!
					</div>
					<details class="fieldset" open>
						<summary>Review file information</summary>
						<dl>
							<dt class="decrypt-detail-name">File name</dt>
							<dd class="decrypt-detail-value">
								{#if filename}
									{filename}
								{:else}
									<em>No file name provided</em>
								{/if}
							</dd>
							<dt class="decrypt-detail-name">File size</dt>
							<dd class="decrypt-detail-value">
								<HumanFileSize value={blob.size} />
							</dd>
							{#if hint}
								<dt class="decrypt-detail-name">Hint</dt>
								<dd class="decrypt-detail-value">
									<pre>{hint}</pre>
								</dd>
							{/if}
						</dl>
					</details>

					<details class="fieldset">
						<summary>Advanced options</summary>
						<fieldset disabled={working || null}>
							<legend class="sr-only">File configuration</legend>
							<label class="label">
								<span>Override file name</span>
								<input
									name={EFormFields.FILENAME}
									type="text"
									placeholder={filename}
									disabled={noFilename || null}
									maxlength="255"
								/>
							</label>
							<label class="checkbox">
								<input
									on:change={handleNoFilenameSelection}
									name={EFormFields.NO_FILENAME}
									type="checkbox"
								/>
								<span>No file name</span>
							</label>
						</fieldset>
					</details>
				{/if}

				<fieldset class="fieldset" disabled={working || null}>
					<legend class="sr-only">Form actions</legend>
					{#if !(blob instanceof Blob)}
						<button class="secondary-button" type="reset"
							>Reset</button
						>
						<button class="primary-button" type="submit"
							>Next &#x2192;</button
						>
					{:else}
						<button class="secondary-button" type="reset"
							>Cancel</button
						>
						<button class="primary-button" type="submit"
							>&#x1f4be;&#xfe0e; Download</button
						>
					{/if}
				</fieldset>
			</form>
		</div>
	{/if}
</main>
