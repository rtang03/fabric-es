#!/usr/bin/env bash

#########################################
# This is used for development scenario
# of auth-server, which requires 3 images
# Build 1. auth-server docker image
# Build 2. proxy docker image
# Build 3. ui-account docker image
#########################################

if [[ ( $# -eq 1 ) && ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: ./dev-net-build.new-auth.sh"
  exit 0
fi

. ./scripts/setup.sh

SECONDS=0

./cleanup.sh

# STEP 1
printf "Cleaning up old image $AUTH_IMAGE\n"
docker rmi $AUTH_IMAGE

# STEP 4 - build auth server image
cd $ROOT_DIR/packages/auth
DOCKER_BUILD=1 docker build --no-cache -t $AUTH_IMAGE .
printMessage "Create auth-server image" $?

sleep 1

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
