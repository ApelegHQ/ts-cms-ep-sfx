/* Copyright © 2024 Exact Realty Limited. All rights reserved.
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
 */

import { ERROR_ELEMENT_ID_ } from '~/lib/elementIds.js';

type CSSProperty = keyof Omit<
	Partial<CSSStyleDeclaration>,
	| 'length'
	| 'parentRule'
	| 'getPropertyPriority'
	| 'getPropertyValue'
	| 'item'
	| 'removeProperty'
	| 'setProperty'
>;

self.onerror = function (
	event: ErrorEvent | string,
	_document: Document,
	_e$: HTMLElement | null,
	_paragraph$: HTMLParagraphElement,
) {
	// These are just to avoid declaring variables and unused as arguments
	void _document;
	void _e$;
	void _paragraph$;

	_document = document;
	_e$ = _document.getElementById(ERROR_ELEMENT_ID_);
	if (_e$) {
		_e$.style['display'] = 'block';
		if (event) {
			_paragraph$ = _document.createElement('p');
			_paragraph$.appendChild(
				_document.createTextNode(
					(event as unknown as ErrorEvent).message ||
						(event as unknown as string),
				),
			);
			for (;;) {
				if (
					(_e$ as HTMLElement).firstChild &&
					((_e$ as HTMLElement).firstChild as HTMLElement)
						.nodeType === 1
				) {
					_e$ = (_e$ as HTMLElement).firstChild as HTMLElement;
				} else {
					break;
				}
			}
			(_e$.parentNode as HTMLElement).appendChild(_paragraph$);
		}
	}
	return false;
} as unknown as Window['onerror'];

if (typeof Reflect === [] + [][0])
	self.onload = function (
		_document: Document,
		_body$: HTMLElement,
		_createElement: Document['createElement'],
		_div$: HTMLDivElement,
		_divStyles: string[],
		_paragraph$: HTMLParagraphElement,
		_paragraphStyles: string[],
		_applyStyle: ($: HTMLElement, y: string[], i?: number) => void,
	) {
		// Unused values as they're there just to help minification by avoiding
		// variable declarations
		void _document;
		void _body$;
		void _createElement;
		void _div$;
		void _divStyles;
		void _paragraph$;
		void _paragraphStyles;
		void _applyStyle;

		_document = document;
		_body$ = _document.body;
		_createElement = _document.createElement.bind(_document);
		_div$ = _createElement('div');
		_divStyles =
			'position|relative|zIndex|999|width|100%|margin|0|padding|4px|backgroundColor|#ffffde|color|#333|borderBottom|2px solid #8c8475|fontSize|12px|fontFamily|Verdana'.split(
				'|',
			);
		_paragraph$ = _createElement('p');
		_paragraphStyles = ['maxWidth', '1024px', 'margin', '0 auto'];
		_applyStyle = function ($: HTMLElement, y: string[], i?: number) {
			for (i = 0; i < y.length; i += 2)
				$.style[y[i] as CSSProperty] = y[i + 1];
		};
		_applyStyle(_paragraph$, _paragraphStyles);
		_applyStyle(_div$, _divStyles);
		_paragraph$['lang'] = 'en';
		_paragraph$.appendChild(
			_document.createTextNode(
				'Your browser is unsupported and some functionality might not work as intended.',
			),
		);
		_div$.appendChild(_paragraph$);
		_body$.insertBefore(_div$, _body$.firstChild);
	} as unknown as Window['onload'];
