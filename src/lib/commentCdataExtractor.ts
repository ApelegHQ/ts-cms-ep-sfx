/* Copyright © 2024 Apeleg Limited. All rights reserved.
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

// Delimiters look like:
//   * start: `><!--` (XML) / `<![CDATA[><!--` (HTML)
//   * end: `- --><!` (XML) / `:--><!]]>` (HTML)
const commentCdataExtractor_ = (text: string) => {
	const matches = text.match(
		/^\s*(?:<!\[CDATA\[)?><!--([\S\s]*):--><!(?:]]>)?\s*$/,
	);
	if (matches) {
		return matches[1].trim();
	}
};

export default commentCdataExtractor_;
