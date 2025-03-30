#!/bin/sh
set -e
git fetch --tags
curl -sSL  -o 'OpenJDK21U-jdk_x64_linux_hotspot_21.0.6_7.tar.gz' 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.6%2B7/OpenJDK21U-jdk_x64_linux_hotspot_21.0.6_7.tar.gz'
printf 'a2650fba422283fbed20d936ce5d2a52906a5414ec17b2f7676dddb87201dbae  OpenJDK21U-jdk_x64_linux_hotspot_21.0.6_7.tar.gz\n' | sha256sum -c
tar -xzf 'OpenJDK21U-jdk_x64_linux_hotspot_21.0.6_7.tar.gz'
export JAVA_HOME="$(pwd)/jdk-21.0.6+7"
export PATH="$JAVA_HOME/bin:$PATH"
export LC_ALL="C"
export TZ="UTC"
export NODE_ENV="production"
export BUILD_TYPE="release"
export SIGNATURE_MODE="opportunistic"
npm run build
