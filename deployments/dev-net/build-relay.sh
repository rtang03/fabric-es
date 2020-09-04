#!/bin/bash

################################
# Create build context of relay
################################

. ./scripts/setup.sh

ORG=$1

rm -fr $ROOT_DIR/.build
mkdir -p $ROOT_DIR/.build
cp $ROOT_DIR/package.json $ROOT_DIR/.build/

# Building packages
for PKG in operator fabric-cqrs gateway-lib relay-lib model-common model-pboc rl-${ORG}
do
  rm -fr $ROOT_DIR/packages/$PKG/dist
  $LIBS_DIR/.bin/tsc -p $ROOT_DIR/packages/$PKG/tsconfig.prod.json
done

# Packing library files
for PKG in operator fabric-cqrs gateway-lib relay-lib model-common model-pboc
do
  mkdir -p $ROOT_DIR/.build/packages/$PKG
  cp $ROOT_DIR/packages/$PKG/package.json $ROOT_DIR/.build/packages/$PKG/
  cp -R $ROOT_DIR/packages/$PKG/dist $ROOT_DIR/.build/packages/$PKG/
done

# Packing app files
mkdir -p $ROOT_DIR/.build/packages/rl-${ORG}/connection
cp $ROOT_DIR/entrypoint.sh $ROOT_DIR/.build/
cp $ROOT_DIR/yarn.lock $ROOT_DIR/.build/
cp $ROOT_DIR/packages/rl-${ORG}/package.json $ROOT_DIR/packages/rl-${ORG}/processes.yaml $ROOT_DIR/.build/packages/rl-${ORG}/
cp -R $ROOT_DIR/packages/rl-${ORG}/dist $ROOT_DIR/.build/packages/rl-${ORG}/
cp ${CONF_DIR}rl-${ORG}/.env.prod.rl $ROOT_DIR/.build/packages/rl-${ORG}/.env
cp ${CONF_DIR}rl-${ORG}/connection-${ORG}.docker.yaml $ROOT_DIR/.build/packages/rl-${ORG}/connection
