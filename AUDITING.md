# Auditing

## Purpose of this document

This document is meant to highlight security-relevant aspects of this tool that
might be relevant to facilitate a rigorous audit process.

## Data exfiltration

These are some of the built-in protections to prevent data exfiltration.

### Content Security Policy (CSP)

Content Security Policy (CSP) is used to limit communication with the outside
world. In particular, no external resources are allowed to be loaded. You can
verify this by assessing the contents of the corresponding `<meta>` tag and note
that no external content is allowed.

### Navigation

-   **`window.open`:** `window.open`, or similar functions that can be used to
    make requests to external resources, is not used.
-   **Form submissions:** No forms with an external `action` are used. This is
    further enforced with CSP.
-   Links: Links to external resources use statically-defined URLs that do not
    depend on user input. No links to external resources are opened without user
    interaction.

### Dynamic resource loading

-   **`fetch()` / `XMLHttpRequest`:** Only used on local resources. Also
    restricted by CSP.
-   **`import()`:** Not used. Also restricted by CSP.
-   **`ping` attribute**: Not used. Also restricted by CSP.
-   **Other dynamic resources**: Not used. Also restricted by CSP.

### Additional measures

All cryptographic operations are sandboxed where possible. This places
additional restrictions on the flow of data.

## Correctness

### Cryptographic primitives

This application relies on the primitives exposed by the `SubtleCypto` API, and
the cryptographic operations used are restricted to what is needed to construct
and parse a Cryptographic Message Syntax (CMS) payload.

The following methods of the `SubtleCypto` API are used:

-   **`decrypt`:** When decrypting a file, this function is used to decrypt the
    Content Encryption Key (CEK) with a password-derived Key Encryption Key (KEK),
    and to use that CEK to decrypt the file and file name.
-   **`deriveKey`:** When encrypting or decrypting a file, this function is used
    to derive the Key Encryption Key (KEK) from a user-supplied password.
-   **`encrypt`:** When encrypting a file, this function is used to encrypt the
    Content Encryption Key (CEK) with a password-derived Key Encryption Key (KEK),
    and to use that CEK to encrypt the file and file name.
-   **`exportKey`:** When encrypting a file, this function is used to export the
    randomly-generated Content Encryption Key (CEK). This is needed so that it can
    then be encrypted using the Key Encryption Key (KEK) and included, in
    encrypted form, in the CMS payload.
-   **`generateKey`:** When encrypting a file, this function is used to generate
    a random AES-256-GCM Content Encryption Key (CEK), which is subsequently used
    to encrypt user-supplied data.
-   **`importKey`:** When encrypting or decrypting a file, this function is used
    on the user-supplied password in order to derive the Key Encryption Key (KEK).
    Additionally, when decrypting a file, this function is used to import the
    Content Encryption Key (CEK) after it has been decrypted.

In addition, the `getRandomValues` method of the `Crypto` API is used as an
entropy source when encrypting a file. This is used to derive a salt, used in
the KEK derivation process, as well as to generate initialisation vectors (IVs)
for encrypted payloads.

### Password-based key derivation

The user-supplied password is used to derive the Key Encryption Key (KEK) using
the PBKDF2 algorithm. This is implemented in the file `src/lib/deriveKEK.ts`.

### Data encryption and decryption

#### Data encryption

User-supplied data (file and file name) are encrypted in two separate steps, one
for file contents and another for a file name. The base implementation for
encryption can be found in the file `src/lib/fileEncryptionCms.ts`. In addition,
the file `src/sandbox/fileEncryptionCms.ts` implements the two distinct steps
used for contents and name.

#### Data decryption

User-supplied data (file and file name) are decrypted in two separate steps, one
for file contents and another for a file name. The base implementation for
decryption can be found in the file `src/lib/fileDecryptionCms.ts`. In addition,
the file `src/sandbox/fileDecryptionCms.ts` implements the two distinct steps
used for contents and name.

#### Initialisation vector (IV) reuse

Because this application uses AES-256-GCM, it is of paramount importance that
initialisation vectors are not reused. This is accomplished by generating fresh
initialisation vectors each time one is needed.

#### Other relevant files

-   **`src/lib/constructCmsData.ts`:** This file implements construction of a
    CMS payload (used after encryption). It does not handle unprotected user data,
    but is used to produce a payload that is derived from user input.
-   **`src/lib/fixBrokenSandboxSecureContext.ts`:** This file is used to define
    various methods provided by the `SubtleCrypto` API if they are not available.
    Certain browsers do not consider the sandboxed environment a _secure context_,
    which means that the `SubtleCrypto` API is not available. In those cases, this
    file is used to define those methods with an external implementation, provided
    by the top document. While this is necessary in these situations, it negates
    some of isolation that a fully sandboxed environment would provide.
-   **`src/lib/parseCmsData.ts`:** This file implements partial parsing of a CMS
    payload (used before decryption). It does not handle unprotected user data,
    but it receives user-supplied input that will ultimately be used to recover
    encrypted user data.
-   **`src/lib/setupConstructCmsSandbox.ts`:** This file implements the creation
    of a sandbox for constructing a CMS payload. The sandbox entrypoint is that
    from `src/sandbox/constructCmsData.ts`.
-   **`src/lib/setupDecryptionSandbox.ts`:** This file implments the creation of
    two sandboxes used during decryption, one to derive the KEK and another one to
    decrypt data. The sandbox entrypoints are those from
    `src/sandbox/deriveKEK.ts` and `src/lib/fileDecryptionCms.ts`.
-   **`src/lib/setupEncryptionSandbox.ts`:** This file implments the creation of
    two sandboxes used during encryption, one to derive the KEK and another one to
    encrypt data. The sandbox entrypoints are those from
    `src/sandbox/deriveKEK.ts` and `src/lib/fileEncryptionCms.ts`.
-   **`src/lib/setupParseCmsSandbox.ts`:** This file implements the creation
    of a sandbox for parsing a CMS payload. The sandbox entrypoint is that
    from `src/sandbox/parseCmsData.ts`.
-   **`src/sandbox/constructCmsData.ts`:** Wrapper around
    `src/lib/constructCmsData.ts`.
-   **`src/sandbox/deriveKEK.ts`:** Wrapper around `src/sandbox/deriveKEK.ts`.
-   **`src/sandbox/parseCmsData.ts`:** Wrapper around `src/lib/parseCmsData.ts`.
