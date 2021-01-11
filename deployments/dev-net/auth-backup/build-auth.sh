#!/bin/bash

###############################
# Create build context of auth
###############################

. ./scripts/setup.sh

rm -fr $ROOT_DIR/packages/auth/build
mkdir -p $ROOT_DIR/packages/auth/build

# Building the auth package
rm -fr $ROOT_DIR/packages/auth/dist
$LIBS_DIR/.bin/tsc -p $ROOT_DIR/packages/auth/tsconfig.prod.json

# Packing app files
cp $ROOT_DIR/packages/auth/package.json $ROOT_DIR/packages/auth/processes.yaml $ROOT_DIR/packages/auth/build/
cp $ROOT_DIR/packages/auth/.env.prod $ROOT_DIR/packages/auth/build/.env
cp -R $ROOT_DIR/packages/auth/dist $ROOT_DIR/packages/auth/build/
cp $ROOT_DIR/packages/auth/entrypoint.sh $ROOT_DIR/packages/auth/build/
