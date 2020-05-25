#!/bin/bash

################################
# Create build context of relay
################################

. ./scripts/setup.sh

cd $ROOT_DIR/packages/relay

rm -fr ./build
mkdir -p ./build

# Building the proxy package
rm -fr ./dist
$LIBS_DIR/.bin/tsc

# Packing app files
cp ./package.json ./build/
cp ./.env.prod ./build/.env
cp -R ./dist ./build/
