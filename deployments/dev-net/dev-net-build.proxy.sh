#!/usr/bin/env bash

#################################
# Build proxy docker image
#################################

. ./scripts/setup.sh

SECONDS=0

printf "Cleaning up old image $PROXY_IMAGE\n"
docker rmi $PROXY_IMAGE

cd $ROOT_DIR/packages/proxy
DOCKER_BUILD=1 docker build --no-cache -t $PROXY_IMAGE .
printMessage "Create proxy image" $?
sleep 1

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"

