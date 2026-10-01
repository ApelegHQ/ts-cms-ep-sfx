#!/bin/sh
set -e
git fetch --tags
curl --proto '=https' --proto-redir '=https' -sSL  -o 'OpenJDK21U-jdk_x64_linux_hotspot_21.0.9_10.tar.gz' 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.9%2B10/OpenJDK21U-jdk_x64_linux_hotspot_21.0.9_10.tar.gz'
printf '810d3773df7e0d6c4394e4e244b264c8b30e0b05a0acf542d065fd78a6b65c2f  OpenJDK21U-jdk_x64_linux_hotspot_21.0.9_10.tar.gz\n' | sha256sum -c
tar -xzf 'OpenJDK21U-jdk_x64_linux_hotspot_21.0.9_10.tar.gz'
export JAVA_HOME="$(pwd)/jdk-21.0.9+10"
export PATH="$JAVA_HOME/bin:$PATH"
export LC_ALL="C"
export TZ="UTC"
export NODE_ENV="production"
export BUILD_TYPE="release"
export SIGNATURE_MODE="opportunistic"
npm run build
