#!/usr/bin/env bash

#################################
# Build Auth-Server docker image
#################################

if [[ ( $# -eq 1 ) && ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: ./dev-net-build.auth.sh"
  exit 0
fi

. ./scripts/setup.sh

SECONDS=0

./cleanup.sh

# STEP 1
printf "Cleaning up old image $AUTH_IMAGE\n"
docker rmi $AUTH_IMAGE

# STEP 2 - create build context at ~/.build
# ==> TODO WRONG
cd $ROOT_DIR && yarn build:authv2
printMessage "Create build context for auth-server"  $?
sleep 1

# STEP 3 - build auth-server image
DOCKER_BUILD=1 docker build --no-cache -f ./packages/auth/Dockerfile -t auth:1.0 .
printMessage "Create auth-server image" $?
sleep 1

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
