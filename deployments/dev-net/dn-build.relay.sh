#!/bin/bash

#######################################
# Build relay docker image
#######################################

if [[ ( $# -eq 1 ) && ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: ./dn-build.relay.sh"
  exit 0
fi

. ./scripts/setup.sh

SECONDS=0

./cleanup.sh

printf "Cleaning up old image $RELAY_IMAGE\n"
docker rmi $RELAY_IMAGE

printf "Creating build context of relay server ...\n"
./build-relay.sh

printMessage "Create build context for relay server"  $?
sleep 1

### build image ###
cd $ROOT_DIR/packages/relay
DOCKER_BUILD=1 docker build --no-cache -t $RELAY_IMAGE .
printMessage "Create relay image" $?
sleep 1

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
