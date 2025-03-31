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
		STRING__UNIT_BYTE_,
		STRING__UNIT_BYTE_B_,
		STRING__UNIT_GIBIBYTE_,
		STRING__UNIT_GIBIBYTE_GiB_,
		STRING__UNIT_KIBIBYTE_,
		STRING__UNIT_KIBIBYTE_KiB_,
		STRING__UNIT_MEBIBYTE_,
		STRING__UNIT_MEBIBYTE_MiB_,
		STRING__UNIT_PEBIBYTE_,
		STRING__UNIT_PEBIBYTE_PiB_,
		STRING__UNIT_TEBIBYTE_,
		STRING__UNIT_TEBIBYTE_TiB_,
	} from '~/i18n/strings.js';

	let value_: number;

	export { value_ as value };
</script>

<data value={value_}>
	{#if value_ >= 1125899906842624}
		{(value_ / 1125899906842624).toFixed(2)}&#x202f;<abbr
			title={STRING__UNIT_PEBIBYTE_}>{STRING__UNIT_PEBIBYTE_PiB_}</abbr
		>
	{:else if value_ >= 1099511627776}
		{(value_ / 1099511627776).toFixed(2)}&#x202f;<abbr
			title={STRING__UNIT_TEBIBYTE_}>{STRING__UNIT_TEBIBYTE_TiB_}</abbr
		>
	{:else if value_ >= 1073741824}
		{(value_ / 1073741824).toFixed(2)}&#x202f;<abbr
			title={STRING__UNIT_GIBIBYTE_}>{STRING__UNIT_GIBIBYTE_GiB_}</abbr
		>
	{:else if value_ >= 1048576}
		{(value_ / 1048576).toFixed(2)}&#x202f;<abbr
			title={STRING__UNIT_MEBIBYTE_}>{STRING__UNIT_MEBIBYTE_MiB_}</abbr
		>
	{:else if value_ >= 1024}
		{(value_ / 1024).toFixed(2)}&#x202f;<abbr title={STRING__UNIT_KIBIBYTE_}
			>{STRING__UNIT_KIBIBYTE_KiB_}</abbr
		>
	{:else}
		{value_}&#x202f;<abbr title={STRING__UNIT_BYTE_}
			>{STRING__UNIT_BYTE_B_}</abbr
		>
	{/if}
</data>
