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

import {
	Asn1ContextSpecific,
	Asn1Object,
	Asn1Sequence,
} from '@exact-realty/asn1-der';
import {
	ContentEncryptionAlgorithmIdentifier,
	ContentType,
	EncryptedContent,
	EncryptedContentInfo,
	EncryptedKey,
	EnvelopedData,
	KeyDerivationAlgorithmIdentifier,
	KeyEncryptionAlgorithmIdentifier,
	PasswordRecipientInfo,
	RecipientInfo,
	RecipientInfos,
} from '@exact-realty/cms-classes/cms';
import {
	OID_PKCS7_DATA,
	OID_PKCS7_ENVELOPEDDATA,
} from '@exact-realty/crypto-oids';

const constructCmsData_ = (
	salt: AllowSharedBufferSource,
	iterationCount: number,
	noncePWRI: AllowSharedBufferSource,
	encryptedKey: AllowSharedBufferSource,
	nonceECI: AllowSharedBufferSource,
	encryptedContent: AllowSharedBufferSource,
): Asn1Sequence => {
	return new Asn1Sequence([
		new Asn1Object(OID_PKCS7_ENVELOPEDDATA),
		new Asn1ContextSpecific(
			0,
			new EnvelopedData(
				new RecipientInfos([
					new RecipientInfo(
						new PasswordRecipientInfo(
							KeyEncryptionAlgorithmIdentifier.pwriAes256gcm(
								noncePWRI,
							),
							new EncryptedKey(encryptedKey),
							KeyDerivationAlgorithmIdentifier.pbkdf2sha256(
								salt,
								iterationCount,
							),
						),
					),
				]),
				new EncryptedContentInfo(
					new ContentType(OID_PKCS7_DATA),
					ContentEncryptionAlgorithmIdentifier.aes256gcm16(nonceECI),
					new EncryptedContent(encryptedContent),
				),
			),
			true,
		),
	]);
};

export default constructCmsData_;
