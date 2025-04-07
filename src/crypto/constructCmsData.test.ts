/* Copyright © 2025 Apeleg Limited. All rights reserved.
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
	ASN1_CLASS_CONTEXT_SPECIFIC_,
	ASN1_CLASS_UNIVERSAL_,
	Asn1ContextSpecific,
	Asn1Integer,
	Asn1Object,
	Asn1OctetString,
	Asn1Sequence,
} from '@apeleghq/asn1-der';
import {
	AuthEnvelopedData,
	ContentEncryptionAlgorithmIdentifier,
	ContentType,
	EncryptedContent,
	EncryptedContentInfo,
	KeyDerivationAlgorithmIdentifier,
	KeyEncryptionAlgorithmIdentifier,
	MessageAuthenticationCode,
	PasswordRecipientInfo,
	RecipientInfo,
	RecipientInfos,
} from '@apeleghq/cms-classes/cms';
import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import constructCmsData from './constructCmsData.js';

// These values need not be cryptographically valid, as the tests are only
// verifying the structure of the resulting ASN.1 sequence.
const dummySalt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
const dummyIterationCount = Number.MAX_SAFE_INTEGER;
const dummyIvPWRI = new Uint8Array([
	9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
]);
const dummyEncryptedKey = new Uint8Array([
	25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43,
	44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62,
	63, 64, 65, 66, 67, 68, 69, 70, 71, 72,
]);
const dummyNonceECI = new Uint8Array([
	72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83,
]);
const dummyEncryptedContent = new Uint8Array([83, 84, 85, 86, 87, 88, 89, 90]);
const dummyTag = new Uint8Array([
	91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106,
]);

describe('constructCmsData', () => {
	it('Structure is well-formed', () => {
		const cmsData = constructCmsData(
			dummySalt,
			dummyIterationCount,
			dummyIvPWRI,
			dummyEncryptedKey,
			dummyNonceECI,
			dummyEncryptedContent,
			dummyTag,
		);

		// Verify that the main container is an Asn1Sequence
		assert.ok(
			cmsData instanceof Asn1Sequence,
			'cmsData should be an instance of Asn1Sequence',
		);

		// The sequence should contain exactly 2 items.
		assert.equal(cmsData.data_?.length, 2);

		// Verify the first element is an Asn1Object with the expected OID
		const firstItem = cmsData.data_[0];
		assert.ok(
			firstItem instanceof Asn1Object,
			'First item should be an instance of Asn1Object',
		);
		assert.equal(
			firstItem.class_,
			ASN1_CLASS_UNIVERSAL_,
			'Should be universal',
		);
		assert.equal(firstItem.tag_, 6);
		assert.deepEqual(
			firstItem.rawContents_(),
			new Uint8Array([
				0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x09, 0x10, 0x01,
				0x17,
			]).buffer,
			'First item should have expected OID',
		);

		// Verify the second element is an Asn1ContextSpecific with tag 0 and encapsulated AuthEnvelopedData
		const secondItem = cmsData.data_[1];
		assert.ok(
			secondItem instanceof Asn1ContextSpecific,
			'Second item should be an instance of Asn1ContextSpecific',
		);
		assert.equal(
			secondItem.class_,
			ASN1_CLASS_CONTEXT_SPECIFIC_,
			'Should be context-specific',
		);
		assert.equal(secondItem.tag_, 0, 'Context specific tag should be 0');

		// The content of the Asn1ContextSpecific should be an instance of AuthEnvelopedData.
		const authEnvelopedData = secondItem.data_;
		assert.ok(
			authEnvelopedData instanceof AuthEnvelopedData,
			'Encapsulated value should be an instance of AuthEnvelopedData',
		);

		//
		// Further checks on the AuthEnvelopedData structure.
		//
		// The sequence should contain exactly 4 items.
		assert.equal(authEnvelopedData.data_?.length, 4);

		// 1. Verify RecipientInfos structure.
		const recipientInfos = authEnvelopedData.data_[1];
		assert.ok(
			recipientInfos instanceof RecipientInfos,
			'RecipientInfos should be an instance of RecipientInfos',
		);
		assert.equal(
			recipientInfos.data_?.length,
			1,
			'There should be exactly one RecipientInfo',
		);

		const recipientInfo = recipientInfos.data_[0];
		assert.ok(
			recipientInfo instanceof RecipientInfo,
			'Item in RecipientInfos should be an instance of RecipientInfo',
		);

		// Verify that the PasswordRecipientInfo exists.
		const pwRecipientInfo = recipientInfo.data_;
		assert.ok(
			pwRecipientInfo instanceof PasswordRecipientInfo,
			'RecipientInfo should encapsulate a PasswordRecipientInfo',
		);

		// The sequence should contain exactly 4 items.
		assert.equal(pwRecipientInfo.data_?.length, 4);

		// Check that KeyEncryptionAlgorithmIdentifier is created using pwriAes256cbc.
		// In this sample, we check that the ivPWRI value is passed correctly.
		const keyEncAlg = pwRecipientInfo.data_[2];
		// We expect that keyEncAlg was produced via KeyEncryptionAlgorithmIdentifier.pwriAes256cbc
		// So it should contain the iv (this check depends on the internal structure of your classes).
		assert.ok(
			keyEncAlg instanceof KeyEncryptionAlgorithmIdentifier,
			'keyEncryptionAlgorithm should be an instance of KeyEncryptionAlgorithmIdentifier',
		);

		// The sequence should contain exactly 2 items.
		assert.equal(keyEncAlg.data_?.length, 2);

		const contentEncAlg = keyEncAlg.data_[1];
		// We expect that keyEncAlg was produced via KeyEncryptionAlgorithmIdentifier.pwriAes256cbc
		// So it should contain the iv (this check depends on the internal structure of your classes).
		assert.ok(
			contentEncAlg instanceof ContentEncryptionAlgorithmIdentifier,
			'contentEncryptionAlgorithm should be an instance of ContentEncryptionAlgorithmIdentifier',
		);

		// The sequence should contain exactly 2 items.
		assert.equal(contentEncAlg.data_?.length, 2);

		const contentEncAlgIv = contentEncAlg.data_[1];
		// We expect that keyEncAlg was produced via KeyEncryptionAlgorithmIdentifier.pwriAes256cbc
		// So it should contain the iv (this check depends on the internal structure of your classes).
		assert.ok(
			contentEncAlgIv instanceof Asn1OctetString,
			'contentEncryptionAlgorithm param should be an instance of Asn1OctetString',
		);

		// keyEncAlg has a parameter property which is our ivPWRI.
		assert.deepStrictEqual(
			contentEncAlgIv.data_,
			dummyIvPWRI,
			'contentEncryptionAlgorithm should hold the provided ivPWRI',
		);

		// 2. Verify KeyDerivationAlgorithmIdentifier (via pbkdf2sha512) inside PasswordRecipientInfo.
		const keyDerAlgItem = pwRecipientInfo.data_[1];

		assert.ok(
			keyDerAlgItem instanceof Asn1ContextSpecific,
			'Second item should be an instance of Asn1ContextSpecific',
		);
		assert.equal(
			keyDerAlgItem.class_,
			ASN1_CLASS_CONTEXT_SPECIFIC_,
			'Should be context-specific',
		);
		assert.equal(keyDerAlgItem.tag_, 0, 'Context specific tag should be 0');

		// The content of the Asn1ContextSpecific should be an instance of AuthEnvelopedData.
		const keyDerAlg = keyDerAlgItem.data_;
		assert.ok(
			authEnvelopedData instanceof AuthEnvelopedData,
			'Encapsulated value should be an instance of AuthEnvelopedData',
		);

		assert.ok(
			keyDerAlg instanceof KeyDerivationAlgorithmIdentifier,
			'keyDerivationAlgorithm should be an instance of KeyDerivationAlgorithmIdentifier',
		);

		// The sequence should contain exactly 2 items.
		assert.equal(keyDerAlg.data_?.length, 2);

		const keyDerAlgParams = keyDerAlg.data_[1];

		assert.ok(
			keyDerAlgParams instanceof Asn1Sequence,
			'keyDerAlgParams should be an instance of Asn1Sequence',
		);

		// The sequence should contain exactly 3 items.
		assert.equal(keyDerAlgParams.data_?.length, 3);

		const keyDerAlgParamSalt = keyDerAlgParams.data_[0];

		assert.ok(
			keyDerAlgParamSalt instanceof Asn1OctetString,
			'keyDerAlgParamSalt should be an instance of Asn1OctetString',
		);

		const keyDerAlgParamIterationCount = keyDerAlgParams.data_[1];
		assert.ok(
			keyDerAlgParamIterationCount instanceof Asn1Integer,
			'keyDerAlgParamIterationCount should be an instance of Asn1Integer',
		);

		// Assure that the parameters include our salt and iterationCount.
		assert.deepStrictEqual(
			keyDerAlgParamSalt.data_,
			dummySalt,
			'KeyDerivationAlgorithmIdentifier should hold the provided salt',
		);

		assert.deepEqual(
			keyDerAlgParamIterationCount.data_,
			new Uint8Array([0x1f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]).buffer,
			'KeyDerivationAlgorithmIdentifier should hold the provided iterationCount',
		);

		// 3. Verify EncryptedContentInfo structure.
		const encryptedContentInfo = authEnvelopedData.data_[2];
		assert.ok(
			encryptedContentInfo instanceof EncryptedContentInfo,
			'encryptedContentInfo should be an instance of EncryptedContentInfo',
		);

		// The sequence should contain exactly 3 items.
		assert.equal(encryptedContentInfo.data_?.length, 3);

		// Check that the content type is set correctly.
		const contentType = encryptedContentInfo.data_[0];
		assert.ok(
			contentType instanceof ContentType,
			'contentType should be an instance of ContentType',
		);
		assert.deepEqual(
			contentType.data_,
			new Uint8Array([
				0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x07, 0x01,
			]).buffer,
			'ContentType should have the expected OID',
		);

		// Check that the content encryption algorithm has been set using aes256gcm16 with nonceECI.
		const eciContentEncAlg = encryptedContentInfo.data_[1];
		assert.ok(
			eciContentEncAlg instanceof ContentEncryptionAlgorithmIdentifier,
			'contentEncryptionAlgorithm should be an instance of ContentEncryptionAlgorithmIdentifier',
		);

		// The sequence should contain exactly 2 items.
		assert.equal(eciContentEncAlg.data_?.length, 2);

		const eciContentEncAlgParams = eciContentEncAlg.data_[1];
		// We expect that keyEncAlg was produced via KeyEncryptionAlgorithmIdentifier.pwriAes256cbc
		// So it should contain the iv (this check depends on the internal structure of your classes).
		assert.ok(
			eciContentEncAlgParams instanceof Asn1Sequence,
			'contentEncryptionAlgorithm param should be an instance of Asn1Sequence',
		);

		// The sequence should contain exactly 2 items.
		assert.equal(eciContentEncAlgParams.data_?.length, 2);
		const eciContentEncAlgParamNonce = eciContentEncAlgParams.data_[0];
		assert.ok(
			eciContentEncAlgParamNonce instanceof Asn1OctetString,
			'eciContentEncAlgParamNonce should be an instance of Asn1OctetString',
		);

		// keyEncAlg has a parameter property which is our nonce
		assert.deepStrictEqual(
			eciContentEncAlgParamNonce.data_,
			dummyNonceECI,
			'ContentEncryptionAlgorithmIdentifier should hold the provided nonceECI',
		);

		// Check the encrypted content.
		const encryptedContentItem = encryptedContentInfo.data_[2];
		assert.ok(
			encryptedContentItem instanceof Asn1ContextSpecific,
			'encryptedContent should be an instance of Asn1ContextSpecific',
		);
		assert.equal(
			encryptedContentItem.class_,
			ASN1_CLASS_CONTEXT_SPECIFIC_,
			'Should be context-specific',
		);
		assert.equal(
			encryptedContentItem.tag_,
			0,
			'Context specific tag should be 0',
		);

		const encryptedContent = encryptedContentItem.data_;
		assert.ok(
			encryptedContent instanceof EncryptedContent,
			'encryptedContent should be an instance of EncryptedContent',
		);
		assert.deepStrictEqual(
			encryptedContent.data_,
			dummyEncryptedContent,
			'EncryptedContent should wrap the provided encryptedContent',
		);

		// 4. Verify the MessageAuthenticationCode (tag)
		const mac = authEnvelopedData.data_[3];
		assert.ok(
			mac instanceof MessageAuthenticationCode,
			'messageAuthenticationCode should be an instance of MessageAuthenticationCode',
		);
		assert.deepStrictEqual(
			mac.data_,
			dummyTag,
			'MessageAuthenticationCode should wrap the provided tag',
		);
	});
});
