#!/bin/bash

#######################################
# Build ui docker image
#######################################

if [[ ( $# -eq 1 ) && ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: ./dn-build.proxy.sh"
  exit 0
fi

. ./scripts/setup.sh

SECONDS=0

printf "Cleaning up old image $UI_ACCOUNT_IMAGE\n"
docker rmi $UI_ACCOUNT_IMAGE

cd $ROOT_DIR/packages/ui-control

### build image ###
DOCKER_BUILD=1 docker build --no-cache -t $UI_ACCOUNT_IMAGE .
printMessage "Create ui-control image" $?
sleep 1

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"

