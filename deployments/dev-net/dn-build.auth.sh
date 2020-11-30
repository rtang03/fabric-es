#!/bin/bash

#######################################
# Build Auth-Server docker image
#######################################

if [[ ( $# -eq 1 ) && ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: ./dn-build.auth.sh"
  exit 0
fi

. ./scripts/setup.sh

SECONDS=0

./cleanup.sh

printf "Cleaning up old image $AUTH_IMAGE\n"
docker rmi $AUTH_IMAGE

printf "Creating build context of auth-server ...\n"
./build-auth.sh

printMessage "Create build context for auth-server"  $?
sleep 1

### build image ###
cd $ROOT_DIR/packages/auth
DOCKER_BUILD=1 docker build --no-cache -t $AUTH_IMAGE .
docker tag $AUTH_IMAGE auth-server
printMessage "Create auth-server image" $?
sleep 1

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"

