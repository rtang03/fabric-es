#!/usr/bin/env bash

#################################
# Build Auth-Server docker image
#################################

. ./scripts/setup.sh

SECONDS=0

OPTION=-d
if [ $# -eq 1 ]; then
  OPTION=$1
fi
./cleanup.sh $OPTION

# STEP 1
printf "Cleaning up old image $AUTH_IMAGE\n"
docker rmi $AUTH_IMAGE

# STEP 2 - create build context at ~/.build
cd $ROOT_DIR && yarn build:auth
printMessage "Create build context for auth-server"  $?
sleep 1

# STEP 3 - build auth-server image
DOCKER_BUILD=1 docker build --no-cache -f ./auth-server.dockerfile -t $AUTH_IMAGE .
printMessage "Create auth-server image" $?
sleep 1

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
