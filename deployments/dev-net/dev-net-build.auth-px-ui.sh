#!/usr/bin/env bash

#########################################
# This is used for development scenario
# of auth-server, which requires 3 images
# Build 1. auth-server docker image
# Build 2. proxy docker image
# Build 3. ui-account docker image
#########################################

if [[ ( $# -eq 1 ) && ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: ./dev-net-build.auth-px-ui.sh"
  exit 0
fi

. ./scripts/setup.sh

SECONDS=0

./cleanup.sh

# STEP 1
printf "Cleaning up old image $AUTH_IMAGE\n"
docker rmi $AUTH_IMAGE

printf "Cleaning up old image $PROXY_IMAGE\n"
docker rmi $PROXY_IMAGE

printf "Cleaning up old image $UI_ACCOUNT_IMAGE\n"
docker rmi $UI_ACCOUNT_IMAGE

# STEP 2 - create build context at ~/.build
#cd $ROOT_DIR && yarn build:auth
#printMessage "Create build context for auth-server"  $?
#sleep 1

# STEP 3 - build ui-account image
pushd $ROOT_DIR/packages/ui-account
DOCKER_BUILD=1 docker build --no-cache -t $UI_ACCOUNT_IMAGE .
printMessage "Create ui-account image" $?
sleep 1

# STEP 4 - build auth server image
popd
pushd $ROOT_DIR/packages/auth
DOCKER_BUILD=1 docker build --no-cache -t $AUTH_IMAGE .
printMessage "Create auth-server image" $?

sleep 1

# STEP 5 - build proxy image
popd
pushd $ROOT_DIR/packages/proxy
DOCKER_BUILD=1 docker build --no-cache -t $PROXY_IMAGE .
printMessage "Create proxy image" $?

sleep 1

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
