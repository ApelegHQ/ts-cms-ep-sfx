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
	import { onMount } from 'svelte';
	import isTrustedEvent from '~/lib/isTrustedEvent.js';

	let fieldset$: HTMLFieldSetElement;

	onMount(() => {
		fieldset$.addEventListener('drop', onDrop, false);
		fieldset$.addEventListener('keydown', onKeyDown, false);
		fieldset$.addEventListener('click', onClick, false);

		if (!input$.style) return;

		input$.style.setProperty('display', 'none', 'important');
		input$.style.setProperty('position', 'absolute', 'important');
		input$.style.setProperty('transform', 'scale(0)', 'important');
	});

	const onClick = (e: MouseEvent) => {
		if (!isTrustedEvent(e)) return;
		if (e.target === input$) return;

		e.preventDefault();
		input$.click();
	};
	const onKeyDown = (e: KeyboardEvent) => {
		if (!isTrustedEvent(e)) return;

		if (e.key === 'Enter') {
			e.preventDefault();
			input$.click();
		}
	};
	const onDrop = (e: DragEvent) => {
		if (!isTrustedEvent(e)) return;

		if (!e.dataTransfer) return;
		input$.files = e.dataTransfer.files;
		input$.dispatchEvent(new Event('change'));
	};

	let input$: HTMLInputElement;

	let accept_: string | null | undefined = undefined;
	let capture_: boolean | 'user' | 'environment' | null | undefined =
		undefined;
	let className_: string | null | undefined = undefined;
	let disabled_: boolean | null | undefined = undefined;
	let form_: string | null | undefined = undefined;
	let id_: string | null | undefined = undefined;
	let inputId_: string | null | undefined = undefined;
	let multiple_: boolean | null | undefined = undefined;
	let name_: string | null | undefined = undefined;
	let required_: boolean | null | undefined = undefined;
	let role_: string | null | undefined = undefined;
	let style_: string | null | undefined = undefined;
	let tabindex_: number | null | undefined = 0;

	export {
		accept_ as accept,
		capture_ as capture,
		className_ as class,
		disabled_ as disabled,
		form_ as form,
		id_ as id,
		inputId_ as inputId,
		multiple_ as multiple,
		name_ as name,
		required_ as required,
		role_ as role,
		style_ as style,
		tabindex_ as tabindex,
	};
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<fieldset
	on:click
	on:keydown
	on:drop|preventDefault
	on:blur
	on:dragend
	on:dragenter
	on:dragover|preventDefault
	on:dragleave
	on:focus
	on:contextmenu
	on:mousedown
	on:mouseleave
	on:mousemove
	on:mouseover
	bind:this={fieldset$}
	class={className_}
	disabled={disabled_}
	form={form_}
	id={id_}
	role={role_}
	style={style_}
	tabindex={tabindex_}
>
	<slot>
		<p>Drop your files here</p>
	</slot>
	<input
		bind:this={input$}
		on:change
		type="file"
		tabindex="-1"
		accept={accept_}
		capture={capture_}
		disabled={disabled_}
		form={form_}
		id={inputId_}
		multiple={multiple_}
		name={name_}
		required={required_}
	/>
</fieldset>
