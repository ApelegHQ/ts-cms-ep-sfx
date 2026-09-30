#!/bin/sh

set -e
export LC_ALL="C"
export TZ="UTC"

xmllang="$(head -n1 "$1" | cut -d'"' -f4 | tr -dC '[:alnum:]-')"
htmllang="$(head -n1 "$1" | cut -d'"' -f6 | tr -dC '[:alnum:]-')"
dir="$(head -n1 "$1" | cut -d'"' -f8 | tr -dC '[:alnum:]-')"
(
	printf -- '<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="%s" lang="%s" dir="%s"><head><script type="text/plain"><![CDATA[><!--\r\n' "${xmllang}" "${htmllang}" "${dir}"
	printf -- '-----BEGIN PGP SIGNED MESSAGE-----\r\nHash: SHA256\r\n\r\n'
	sq verify --signer-file '../assets/openpgp_signing_key.asc' --message "$1"
	printf -- '\r\n'

	# Extract the armored signature body from the input and emit it as CRLF.
	sed -n '/^-----BEGIN PGP SIGNATURE-----/,/^-----END PGP SIGNATURE-----/p' "$1" |
		tr -d '\r' |
		while IFS= read -r line; do
			printf -- '%s\r\n' "$line"
		done

	printf -- ':--><!]]></script>\r\n</head><body>'
) > verified
head -c"$(wc -c "verified" | cut -d' ' -f1)" "$1" > tbv
diff -up verified tbv

#TODO: Verify any content between
# "$(wc -c "verified" | cut -d' ' -f1)" and the last line consists only of
# <script type="pkcs7MimeType">...</script><script type="application/json">...</script>
# or that it's empty

# Check for potentially dangerous tags
tail -n1 "$1" | grep -qvie '<\(SCRIPT\|LINK\|STYLE\|FRAME\|IFRAME\|FENCEDFRAME\|OBJECT\|EMBED\|BASE\|META\|AUDIO\|VIDEO\|IMG\|PICTURE\|SOURCE\)'
