#!/bin/bash

#######################################
# Build helper service images
# - auth-server, proxy, ui
#######################################

if [[ ( $# -eq 1 ) && ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: ./dn-build.auth-px-ui.sh"
  exit 0
fi

. ./scripts/setup.sh

SECONDS=0

./cleanup.sh

# STEP 1
printf "Building $AUTH_IMAGE\n"

cd $CURRENT_DIR
docker rmi $AUTH_IMAGE
./build-auth.sh
printMessage "Create build context for $AUTH_IMAGE"  $?
sleep 1

cd $ROOT_DIR/packages/auth
DOCKER_BUILD=1 docker build --no-cache -t $AUTH_IMAGE .
printMessage "Create auth-server image" $?
sleep 1

# STEP 2
printf "Building $UI_ACCOUNT_IMAGE\n"

cd $CURRENT_DIR
docker rmi $UI_ACCOUNT_IMAGE

cd $ROOT_DIR/packages/ui-control
DOCKER_BUILD=1 docker build --no-cache -t $UI_ACCOUNT_IMAGE .
printMessage "Create ui-control image" $?
sleep 1

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
