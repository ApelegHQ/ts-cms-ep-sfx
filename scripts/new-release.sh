#!/bin/sh

set -e
export LC_ALL="C"
export TZ="UTC"
export BUILD_TYPE="release"
export NODE_ENV="production"

dir=$(dirname "${0}")

SIGNATURE_MODE="presign" npm run build
. "$dir/sign-release.sh"
SIGNATURE_MODE="mandatory" npm run build
