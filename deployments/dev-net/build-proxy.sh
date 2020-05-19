#!/bin/bash

################################
# Create build context of proxy
################################

. ./scripts/setup.sh

cd $ROOT_DIR/packages/proxy

rm -fr ./build
mkdir -p ./build

# Building the proxy package
rm -fr ./dist
$LIBS_DIR/.bin/tsc

# Packing app files
cp ./package.json ./build/
cp ./.env.prod ./build/.env
cp -R ./dist ./build/
