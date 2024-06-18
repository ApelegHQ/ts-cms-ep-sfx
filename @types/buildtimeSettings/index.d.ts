/* Copyright © 2021 Exact Realty Limited.
 *
 * All rights reserved.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 * REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 * AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 * INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 * LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 * OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 * PERFORMANCE OF THIS SOFTWARE.
 */

/* eslint-disable @typescript-eslint/naming-convention */

declare namespace __buildtimeSettings__ {
	const assetManifest: {
		client?: {
			scripts?: Record<string, string>;
			styles?: Record<string, string>;
		};
	};
	const publicDir: string;
	const buildTarget: 'client' | 'server' | 'worker';
	const ssr: boolean;
	const enableFramebusting: boolean;
	const package: Readonly<{
		name?: string;
		version?: string;
		description?: string;
		keywords?: string;
		homepage?: string;
		bugs?: string;
		license?: string;
		author?:
			| string
			| {
					name: string;
					email?: string;
					url?: string;
			  };
		repository?: string;
	}>;
}
