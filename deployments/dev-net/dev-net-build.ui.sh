#!/usr/bin/env bash

#################################
# Build ui docker image
#################################

. ./scripts/setup.sh

SECONDS=0

printf "Cleaning up old image $UI_ACCOUNT_IMAGE\n"
docker rmi $UI_ACCOUNT_IMAGE

cd $ROOT_DIR/packages/ui-account
DOCKER_BUILD=1 docker build --no-cache -t $UI_ACCOUNT_IMAGE .
printMessage "Create ui-account image" $?
sleep 1

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"

