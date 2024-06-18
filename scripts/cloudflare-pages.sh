#!/bin/sh
set -e
curl -sSL  -o 'OpenJDK21U-jdk_x64_linux_hotspot_21.0.3_9.tar.gz' 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.3%2B9/OpenJDK21U-jdk_x64_linux_hotspot_21.0.3_9.tar.gz'
printf 'fffa52c22d797b715a962e6c8d11ec7d79b90dd819b5bc51d62137ea4b22a340  OpenJDK21U-jdk_x64_linux_hotspot_21.0.3_9.tar.gz\n' | sha256sum -c
tar -xzf 'OpenJDK21U-jdk_x64_linux_hotspot_21.0.3_9.tar.gz' 
export JAVA_HOME="$(pwd)/jdk-21.0.3+9"
export PATH="$JAVA_HOME/bin:$PATH"
export NODE_ENV="production"
npm run build

