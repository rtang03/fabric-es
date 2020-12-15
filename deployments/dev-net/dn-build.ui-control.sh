#!/bin/bash

#######################################
# Build ui docker image
# $@ - list of orgs (e.g. "org1 org2")
#######################################

if [[ ( $# -eq 1 ) && ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: ./dn-build.ui-control.sh"
  exit 0
fi

. ./scripts/setup.sh

SECONDS=0

./cleanup.sh

for ORG in "$@"
do
  UI_IMAGE=${UI_CONTROL_IMAGE}-${ORG}:${RELEASE}

  printf "Cleaning up old image $UI_IMAGE\n"
  docker rmi $UI_IMAGE

  ### prepare build directory ###
  rm -fr $ROOT_DIR/.build
  mkdir -p $ROOT_DIR/.build

  cp -R $ROOT_DIR/packages/ui-control/. $ROOT_DIR/.build/
  cp ${CONF_DIR}gw-${ORG}/.env.local.ui $ROOT_DIR/.build/.env.local
  cd $ROOT_DIR/.build

  ### build image ###
  set -x
  DOCKER_BUILD=1 docker build --no-cache -t $UI_IMAGE .
  res=$?
  docker tag $UI_IMAGE ${UI_CONTROL_IMAGE}-${ORG}
  set +x
  printMessage "Create ui-control image" $res
  sleep 1
done

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
