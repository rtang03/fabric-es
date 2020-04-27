#!/bin/bash

#######################################
# Create build context of auth-server
#######################################

. ./scripts/setup.sh

rm -fr $ROOT_DIR/.build
mkdir -p $ROOT_DIR/.build
cp $ROOT_DIR/package.json $ROOT_DIR/.build/

# Building authentication package
rm -fr $ROOT_DIR/packages/authentication/dist
$LIBS_DIR/.bin/tsc -p $ROOT_DIR/packages/authentication/tsconfig.prod.json

# Packing app files
mkdir -p $ROOT_DIR/.build/packages/authentication
cp $ROOT_DIR/packages/authentication/package.json $ROOT_DIR/packages/authentication/processes.yaml $ROOT_DIR/.build/packages/authentication/
cp ${CONF_DIR}auth/.env.prod $ROOT_DIR/.build/packages/authentication/.env
cp -R $ROOT_DIR/packages/authentication/dist $ROOT_DIR/.build/packages/authentication/
cp -R $ROOT_DIR/packages/authentication/views $ROOT_DIR/.build/packages/authentication/
cp -R $ROOT_DIR/packages/authentication/public $ROOT_DIR/.build/packages/authentication/