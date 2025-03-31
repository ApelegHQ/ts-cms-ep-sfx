#!/bin/sh

set -e
export LC_ALL="C"
export TZ="UTC"

tbs='build/tbs'
user='4168848E814C5A002017FC31B80156AC63FBDE9D'
version=$(jq '--raw-output' '.version' 'package.json')

if git 'rev-parse' '--quiet' '--verify' 'refs/tags/v'"$version"; then
    echo 'Release tag already exists' >&2
    exit 1
fi

signedinfo=''

for tag in $LOCALES; do
    if [ x"$tag" = x'en' ]; then
        tag=''
        suffix=''
    else
        suffix=".${tag}"
    fi
    digest=$(openssl 'dgst' '-binary' '-sha256' "$tbs$suffix" | xxd '-p' '-c' '256')
    signature=$(gpg2 '--armor' '--clear-sign' '--local-user' "$user" '--digest-algo' 'SHA256' '--output' '-' "$tbs$suffix" | sed "-n" '/^-----BEGIN PGP SIGNATURE-----/,$p' | sed "-e" "s/^/:/g")
    signedinfo="$(printf '%s\n::%s\n:%s\n%s\n' "$signedinfo" "$tag" "$digest" "$signature")"
done

printf "%s\n\n%s" "v$version" "$signedinfo" | git 'tag' '-s' "v$version" '-F' '-'
echo 'Created tag v'"$version"
