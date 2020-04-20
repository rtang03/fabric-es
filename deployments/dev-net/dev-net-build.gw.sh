#!/bin/bash

#######################################
# Build gw-orgX docker images
# $@ - list of orgs (e.g. "org1 org2")
#######################################

if [[ ( $# -eq 1 ) && ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: ./dev-net-build.gw.sh [org code 1] {[org code 2] {[org code 3]}}"
  exit 0
fi

. ./scripts/setup.sh

SECONDS=0

./cleanup.sh

for ORG in "$@"
do
  printf "Cleaning up old image fabric-es/gw-${ORG}:${RELEASE}\n"
  docker rmi fabric-es/gw-${ORG}:${RELEASE}

  ### create build context ###
  rm -fr $ROOT_DIR/.build
  mkdir -p $ROOT_DIR/.build
  cp $ROOT_DIR/package.json $ROOT_DIR/.build/

  for PKG in operator fabric-cqrs gateway-lib model-common model-loan model-loan-private gw-${ORG}
  do
    echo "Building package $PKG..."
    rm -fr $ROOT_DIR/packages/$PKG/dist
    $LIBS_DIR/.bin/tsc -p $ROOT_DIR/packages/$PKG/tsconfig.prod.json
  done

  echo "Packing library files..."
  for PKG in operator fabric-cqrs gateway-lib model-common model-loan model-loan-private
  do
    mkdir -p $ROOT_DIR/.build/packages/$PKG
    cp $ROOT_DIR/packages/$PKG/package.json $ROOT_DIR/.build/packages/$PKG/
    cp -R $ROOT_DIR/packages/$PKG/dist $ROOT_DIR/.build/packages/$PKG/
  done

  echo "Packing app files..."
  mkdir -p $ROOT_DIR/.build/packages/gw-${ORG}/connection
  cp $ROOT_DIR/entrypoint.sh $ROOT_DIR/.build/
  cp $ROOT_DIR/packages/gw-${ORG}/package.json $ROOT_DIR/packages/gw-${ORG}/processes.yaml $ROOT_DIR/.build/packages/gw-${ORG}/
  cp -R $ROOT_DIR/packages/gw-${ORG}/dist $ROOT_DIR/.build/packages/gw-${ORG}/
  cp ${CONF_DIR}gw-${ORG}/.env.prod $ROOT_DIR/.build/packages/gw-${ORG}/.env
  cp ${CONF_DIR}gw-${ORG}/connection-${ORG}.docker.yaml $ROOT_DIR/.build/packages/gw-${ORG}/connection

  printMessage "Create build context for gw-${ORG}" $?
  sleep 1

  ### build image ###
  cd $ROOT_DIR
  DOCKER_BUILD=1 docker build --no-cache -f ./gw-${ORG}.dockerfile -t fabric-es/gw-${ORG}:${RELEASE} .
  printMessage "Create image fabric-es/gw-${ORG}:${RELEASE}" $?
  sleep 1
done

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
