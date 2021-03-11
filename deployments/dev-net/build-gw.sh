#!/bin/bash

#######################################
# Create build context of gw-orgX
# $1 - org (org1, org2 or org3)
#######################################

. ./scripts/setup.sh

#############################
# LOCAL variables
#############################
ORGLIST=
PKGLIST='operator fabric-cqrs gateway-lib model-document model-loan'
for ORGS in $*
do
  ORGLIST=$ORGLIST' 'gw-$ORGS
  PKGLIST=$PKGLIST' 'gw-$ORGS
done


#############################
# main
#############################

# clean build
rm -fr $ROOT_DIR/.build
mkdir -p $ROOT_DIR/.build

# common package file
cp $ROOT_DIR/yarn.lock $ROOT_DIR/.build/
cp $ROOT_DIR/package.json $ROOT_DIR/.build/

for PKG in $PKGLIST
do
  # Building packages
  rm -fr $ROOT_DIR/packages/$PKG/dist
  $LIBS_DIR/.bin/tsc -p $ROOT_DIR/packages/$PKG/tsconfig.prod.json

  # Packing library files
  mkdir -p $ROOT_DIR/.build/packages/$PKG
  cp $ROOT_DIR/packages/$PKG/package.json $ROOT_DIR/.build/packages/$PKG/
  cp -R $ROOT_DIR/packages/$PKG/dist $ROOT_DIR/.build/packages/$PKG/
done

# Packing app files
for ORG in $ORGLIST
do
  mkdir -p $ROOT_DIR/.build/packages/${ORG}/connection
  cp ${CONF_DIR}${ORG}/entrypoint.gw.sh $ROOT_DIR/.build/packages/${ORG}
  cp ${CONF_DIR}${ORG}/.env.dev-net.${ORG} $ROOT_DIR/.build/packages/${ORG}/.env
  cp ${CONF_DIR}${ORG}/processes.${ORG}.yaml $ROOT_DIR/.build/packages/${ORG}/processes.yaml
  cp ${CONF_DIR}${ORG}/connection.${ORG}.docker.yaml $ROOT_DIR/.build/packages/${ORG}/connection
done
