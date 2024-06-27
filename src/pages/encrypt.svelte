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

<script lang="typescript" context="module">
	import isCI from '~/lib/isCI.js';

	const defaultIterationCount = isCI ? 1 << 10 : 1 << 24;
</script>

<script lang="typescript">
	import { onDestroy, onMount } from 'svelte';
	import Dropzone from '~/components/Dropzone.svelte';
	import ErrorModal from '~/components/ErrorModal.svelte';
	import Loading from '~/components/Loading.svelte';
	import EFormFields from '~/lib/EFormFields.js';
	import downloadArchive from '~/lib/downloadArchive.js';
	import {
		ENCRYPT_DROPZONE_ELEMENT_ID_,
		MAIN_CONTENT_ELEMENT_ID_,
	} from '~/lib/elementIds.js';
	import isTrustedEvent from '~/lib/isTrustedEvent.js';
	import prepareDownloadableCmsPayload from '~/lib/prepareDownloadableCmsPayload.js';
	import setupConstructCmsSandbox from '~/lib/setupConstructCmsSandbox.js';
	import setupEncryptionSandbox from '~/lib/setupEncryptionSandbox.js';
	import './common.css';
	import './encrypt.css';

	const passwordsEq = (a: string, b: string) => {
		let r = a.length ^ b.length;
		const maxlength = Math.max(a.length, b.length);

		for (let i = 0; i < maxlength; i++) {
			r |= a.charCodeAt(i) ^ b.charCodeAt(i);
		}

		return r === 0;
	};

	let cmsSandbox:
		| Awaited<ReturnType<typeof setupConstructCmsSandbox>>
		| Error
		| undefined;
	let encryptionSandbox:
		| Awaited<ReturnType<typeof setupEncryptionSandbox>>
		| Error
		| undefined;
	let abort: { (): void } | undefined;

	let mainScript$_: HTMLScriptElement | undefined;
	let mainStylesheet$_: HTMLLinkElement | undefined;
	let passwordInput$: HTMLInputElement;
	let passwordConfirmInput$: HTMLInputElement;
	let instance: Record<never, never>;
	let working: boolean = false;
	let filename: string | undefined | null;
	let password: string | undefined;
	let iterationCount: number | undefined;
	let noFilename: boolean = false;
	let filenameOverride: string | undefined | null;
	let encryptionError: Error | undefined;
	let dropzoneActive: boolean = false;

	const init = () => {
		instance = {};
		working = false;
		filename = undefined;
		password = undefined;
		iterationCount = undefined;
		noFilename = false;
		filenameOverride = undefined;
		encryptionError = undefined;
	};

	onMount(() => {
		if (!mainScript$_ || !mainStylesheet$_) {
			const message = 'Unable to locate main script and style elements';
			encryptionSandbox = new Error(message);

			return;
		}

		const abortController = new AbortController();
		const _abort = () => {
			encryptionSandbox = undefined;
			abortController.abort(new Error('Component destroyed'));
		};
		abort = _abort;

		Promise.all([
			setupConstructCmsSandbox(abortController.signal),
			setupEncryptionSandbox(
				() => {
					if (!password) {
						throw new Error('Invalid or missing password');
					}
					return password;
				},
				() => {
					if (!iterationCount) {
						throw new Error('Invalid or missing iteration count');
					}
					return iterationCount;
				},
				abortController.signal,
			),
		])
			.then(([_cmsSandbox, _encryptionSandbox]) => {
				init();
				cmsSandbox = _cmsSandbox;
				encryptionSandbox = _encryptionSandbox;
			})
			.catch((e) => {
				const message = 'Error preparing sandbox';
				console.error(message, e);
				abortController.abort();
				abort = undefined;
				encryptionSandbox = new Error(message);
			});
	});

	onDestroy(() => {
		if (typeof abort === 'function') {
			abort();
		}
	});

	const handleFileChange = (e: Event) => {
		// The event is manually triggered on drop
		// // if (!isTrustedEvent(e)) return;

		const target = e.target;
		if (!target || !(target instanceof HTMLInputElement)) return;

		if (!target.value || !target.files || target.files.length < 1) {
			filename = undefined;
		} else if (target.files.length === 1) {
			const name = target.files[0].name;
			filename = name || null;
		} else {
			filename = undefined;
			throw new Error('Invalid file selection');
		}
	};

	const handlePasswordInput =
		typeof HTMLInputElement.prototype.setCustomValidity === 'function'
			? (e: Event) => {
					if (!isTrustedEvent(e)) return;

					const target = e.target;
					if (!target || !(target instanceof HTMLInputElement))
						return;

					if (
						passwordsEq(passwordConfirmInput$.value, target.value)
					) {
						passwordConfirmInput$.setCustomValidity('');
					} else {
						passwordConfirmInput$.setCustomValidity(
							"Passwords don't match",
						);
					}
				}
			: () => {};

	const handlePasswordConfirmInput =
		typeof HTMLInputElement.prototype.setCustomValidity === 'function'
			? (e: Event) => {
					if (!isTrustedEvent(e)) return;

					const target = e.target;
					if (!target || !(target instanceof HTMLInputElement))
						return;

					if (passwordsEq(target.value, passwordInput$.value)) {
						target.setCustomValidity('');
					} else {
						target.setCustomValidity("Passwords don't match");
					}
				}
			: () => {};

	const handleFileNameInput = (e: Event) => {
		if (!isTrustedEvent(e)) return;

		const target = e.target;
		if (!target || !(target instanceof HTMLInputElement)) return;

		filenameOverride = target.value;
	};

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
		encryptionError = undefined;
		const _instance = instance;
		(async () => {
			const formData = new FormData(target, e.submitter);

			const _password = (formData.get(EFormFields.PASSWORD) ??
				'') as unknown as string;
			const _passwordConfirm = (formData.get(
				EFormFields.PASSWORD_CONFIRM,
			) ?? '') as unknown as string;
			const _iterationCount =
				((formData.get(EFormFields.PBKDF2_ITERATION_COUNT) ??
					'') as unknown as string) || '';
			const _file = formData.get(EFormFields.FILE) as unknown as File;
			const _filename = (formData.get(EFormFields.FILENAME) ??
				'') as unknown as string;
			const _hint = (formData.get(EFormFields.HINT) ??
				'') as unknown as string;
			const _noFilename = !!formData.get(EFormFields.NO_FILENAME);
			const _archiveName = (formData.get(EFormFields.ARCHIVE_FILENAME) ||
				(((!_noFilename && filenameOverride) || filename) &&
					((!_noFilename && filenameOverride) || filename) +
						'.html') ||
				'') as unknown as string;

			if (!_password) {
				throw new Error('Missing password');
			}

			if (!passwordsEq(_passwordConfirm, _password)) {
				throw new Error("Passwords don't match");
			}

			if (!_file || !(_file instanceof File)) {
				throw new Error('Missing or invalid file');
			}

			const _userIterationCount = _iterationCount.match(
				/^\s*0*([1-9][0-9]{0,14})?\s*$/,
			);

			if (!_userIterationCount) {
				throw new Error('Invalid iteration count');
			}

			password = _password;
			iterationCount = _userIterationCount[1]
				? parseInt(_userIterationCount[1])
				: defaultIterationCount;

			const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
				const fileReader = new FileReader();
				fileReader.onerror = () => {
					reject(fileReader.error);
				};
				fileReader.onload = () => {
					resolve(fileReader.result as ArrayBuffer);
				};
				fileReader.readAsArrayBuffer(_file);
			});

			if (
				typeof cmsSandbox !== 'function' ||
				typeof encryptionSandbox !== 'function'
			) {
				throw new TypeError('sandbox is not a function');
			}

			try {
				const cms = await prepareDownloadableCmsPayload(
					cmsSandbox,
					encryptionSandbox,
					buffer,
					(!_noFilename && (_filename || _file.name)) || '',
				);

				if (instance !== _instance) {
					return;
				}

				await downloadArchive(
					mainScript$_!,
					mainStylesheet$_!,
					_archiveName,
					cms,
					_hint,
				);
			} finally {
				if (instance === _instance) {
					password = undefined;
					iterationCount = undefined;
				}
			}
		})()
			.catch((e) => {
				const message = 'Error obtaining encrypted payload';
				console.error(message, e);

				if (instance !== _instance) {
					return;
				}

				encryptionError = new Error(message);
			})
			.finally(() => {
				if (instance !== _instance) {
					return;
				}

				working = false;
			});
	};

	const handleDragEnter = () => {
		dropzoneActive = true;
	};
	const handleDragOver = handleDragEnter;
	const handleDragLeave = () => {
		dropzoneActive = false;
	};
	const handleDrop = handleDragLeave;

	export { mainScript$_ as mainScript$, mainStylesheet$_ as mainStylesheet$ };
</script>

<svelte:head>
	<title>Encrypt</title>
</svelte:head>
<main class="main" id={MAIN_CONTENT_ELEMENT_ID_}>
	{#if !encryptionSandbox}
		<Loading>Getting things ready</Loading>
	{:else if encryptionSandbox instanceof Error}
		<ErrorModal error={encryptionSandbox}></ErrorModal>
	{:else}
		{#if encryptionError instanceof Error}
			<ErrorModal dismissable error={encryptionError}></ErrorModal>
		{/if}
		{#if working}
			<Loading>Processing data&#x2026;</Loading>
		{/if}
		<div class="inner">
			<h2 class="page-title">Encrypt a file</h2>
			<form
				on:submit|preventDefault={handleFormSubmit}
				on:reset={handleFormReset}
				aria-busy={working ? 'true' : 'false'}
				action="about:blank"
				method="POST"
			>
				<Dropzone
					on:dragenter={handleDragEnter}
					on:dragover={handleDragOver}
					on:dragleave={handleDragLeave}
					on:drop={handleDrop}
					on:change={handleFileChange}
					class={[
						'dropzone',
						dropzoneActive && 'dropzone-active',
						filename !== undefined && 'dropzone-selected',
					]
						.filter(Boolean)
						.join(' ')}
					disabled={working || null}
					inputId={ENCRYPT_DROPZONE_ELEMENT_ID_}
					name={EFormFields.FILE}
					required
				>
					<legend class="sr-only">File selection</legend>
					<label for={ENCRYPT_DROPZONE_ELEMENT_ID_} class="sr-only"
						>File</label
					>
					<div class="dropzone-inner">
						{#if filename === undefined}
							<span class="dropzone-icon">&#x1f4ce;&#xfe0e;</span>
							<p class="dropzone-text">Drop your file here</p>
						{:else}
							<span class="dropzone-icon">&#x1f4c3;&#xfe0e;</span>

							<p class="dropzone-text">
								{#if filename}
									{filename}
								{:else}
									<em>File selected</em>
								{/if}
							</p>
						{/if}
					</div>
				</Dropzone>

				<fieldset
					class="fieldset"
					disabled={filename === undefined || working || null}
				>
					<legend class="sr-only">Password configuration</legend>
					<label class="label">
						<span>Password</span>
						<input
							bind:this={passwordInput$}
							on:input={handlePasswordInput}
							autocomplete="new-password"
							name={EFormFields.PASSWORD}
							type="password"
							required
						/>
					</label>

					<label class="label">
						<span>Confirm password</span>
						<input
							bind:this={passwordConfirmInput$}
							on:input={handlePasswordConfirmInput}
							autocomplete="new-password"
							name={EFormFields.PASSWORD_CONFIRM}
							type="password"
							required
						/>
					</label>

					<details class="fieldset">
						<summary>Advanced options</summary>
						<fieldset>
							<legend class="sr-only"
								>Advanced password options</legend
							>
							<label class="label">
								<span
									><abbr
										title="Password&#x2010;Based Key Derivation Function 2"
										>PBKDF2</abbr
									> iteration count</span
								>
								<input
									name={EFormFields.PBKDF2_ITERATION_COUNT}
									type="text"
									placeholder={String(defaultIterationCount)}
									pattern="[0-9]*"
									maxlength="15"
								/>
							</label>
						</fieldset>
					</details>
				</fieldset>

				<details class="fieldset" open>
					<summary>Other options</summary>
					<fieldset
						class="fieldset"
						disabled={filename === undefined || working || null}
					>
						<legend class="sr-only">File configuration</legend>
						<label class="label">
							<span>Override file name</span>
							<input
								on:input={handleFileNameInput}
								name={EFormFields.FILENAME}
								type="text"
								placeholder={filename}
								disabled={filename === undefined || noFilename
									? true
									: null}
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

						<label class="label">
							<span>Hint</span>
							<textarea
								name={EFormFields.HINT}
								disabled={filename === undefined ? true : null}
							></textarea>
						</label>

						<label class="label">
							<span>Archive name</span>
							<input
								name={EFormFields.ARCHIVE_FILENAME}
								type="text"
								placeholder={(!noFilename &&
									filenameOverride) ||
								filename
									? ((!noFilename && filenameOverride) ||
											filename) + '.html'
									: ''}
								maxlength="255"
							/>
						</label>
					</fieldset>
				</details>

				<fieldset class="fieldset" disabled={working || null}>
					<legend class="sr-only">Form actions</legend>
					<button class="secondary-button" type="reset">Reset</button>
					<button
						class="primary-button"
						type="submit"
						disabled={filename === undefined || working || null}
						>&#x1f4be;&#xfe0e; Save</button
					>
				</fieldset>
			</form>
		</div>
	{/if}
</main>
