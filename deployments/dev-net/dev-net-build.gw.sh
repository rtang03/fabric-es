#!/usr/bin/env bash

#######################################
# Build gw-orgX docker images
# $@ - list of orgs (e.g. "org1 org2")
#######################################

. ./scripts/setup.sh

SECONDS=0

./cleanup.sh

for ORG in "$@"
do
  # STEP 1
  printf "Cleaning up old image fabric-es/gw-${ORG}:${RELEASE}\n"
  docker rmi fabric-es/gw-${ORG}:${RELEASE}

  # STEP 2 - create build context
  cd $ROOT_DIR && yarn build:gw-dev-net:${ORG}
  printMessage "Create build context for gw-${ORG}" $?
  sleep 1

  # STEP 5
  DOCKER_BUILD=1 docker build --no-cache -f ./gw-${ORG}.dockerfile -t fabric-es/gw-${ORG}:${RELEASE} .
  printMessage "Create image fabric-es/gw-${ORG}:${RELEASE}" $?
  sleep 1
done

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
