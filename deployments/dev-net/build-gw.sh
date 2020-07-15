#!/bin/bash

#######################################
# Create build context of gw-orgX
# $1 - org (org1, org2 or org3)
#######################################

. ./scripts/setup.sh

ORG=$1

rm -fr $ROOT_DIR/.build
mkdir -p $ROOT_DIR/.build
cp $ROOT_DIR/package.json $ROOT_DIR/.build/

# Building packages
for PKG in operator fabric-cqrs gateway-lib model-common model-document model-loan gw-${ORG}
do
  rm -fr $ROOT_DIR/packages/$PKG/dist
  $LIBS_DIR/.bin/tsc -p $ROOT_DIR/packages/$PKG/tsconfig.prod.json
done

# Packing library files
for PKG in operator fabric-cqrs gateway-lib model-common model-document model-loan
do
  mkdir -p $ROOT_DIR/.build/packages/$PKG
  cp $ROOT_DIR/packages/$PKG/package.json $ROOT_DIR/.build/packages/$PKG/
  cp -R $ROOT_DIR/packages/$PKG/dist $ROOT_DIR/.build/packages/$PKG/
done

# Packing app files
mkdir -p $ROOT_DIR/.build/packages/gw-${ORG}/connection
cp $ROOT_DIR/entrypoint.sh $ROOT_DIR/.build/
cp $ROOT_DIR/yarn.lock $ROOT_DIR/.build/
cp $ROOT_DIR/packages/gw-${ORG}/package.json $ROOT_DIR/packages/gw-${ORG}/processes.yaml $ROOT_DIR/.build/packages/gw-${ORG}/
cp -R $ROOT_DIR/packages/gw-${ORG}/dist $ROOT_DIR/.build/packages/gw-${ORG}/
cp ${CONF_DIR}gw-${ORG}/.env.prod.gw $ROOT_DIR/.build/packages/gw-${ORG}/.env
cp ${CONF_DIR}gw-${ORG}/connection-${ORG}.docker.yaml $ROOT_DIR/.build/packages/gw-${ORG}/connection
