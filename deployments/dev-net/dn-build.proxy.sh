#!/bin/bash

#######################################
# Build proxy docker image
#######################################

if [[ ( $# -eq 1 ) && ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: ./dn-build.proxy.sh"
  exit 0
fi

. ./scripts/setup.sh

SECONDS=0

./cleanup.sh

printf "Cleaning up old image $PROXY_IMAGE\n"
docker rmi $PROXY_IMAGE

printf "Creating build context of proxy server ...\n"
./build-proxy.sh

printMessage "Create build context for proxy server"  $?
sleep 1

### build image ###
cd $ROOT_DIR/packages/proxy
DOCKER_BUILD=1 docker build --no-cache -t $PROXY_IMAGE .
printMessage "Create proxy image" $?
sleep 1

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
