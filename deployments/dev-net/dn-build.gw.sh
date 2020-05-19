#!/bin/bash

#######################################
# Build gw-orgX docker images
# $@ - list of orgs (e.g. "org1 org2")
#######################################

if [[ ( $# -eq 1 ) && ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: ./dn-build.gw.sh [org code 1] {[org code 2] {[org code 3]}}"
  exit 0
fi

. ./scripts/setup.sh

SECONDS=0

./cleanup.sh

for ORG in "$@"
do
  printf "Cleaning up old image fabric-es/gw-${ORG}:${RELEASE}\n"
  docker rmi fabric-es/gw-${ORG}:${RELEASE}

  printf "Creating build context of gw-${ORG} ...\n"
  cd $CURRENT_DIR
  ./build-gw.sh $ORG

  printMessage "Create build context for gw-${ORG}" $?
  sleep 1

  ### build image ###
  cd $ROOT_DIR
  DOCKER_BUILD=1 docker build --no-cache -f ./gw-${ORG}.dockerfile -t fabric-es/gw-${ORG}:${RELEASE} .
  printMessage "Create image fabric-es/gw-${ORG}:${RELEASE}" $?
  sleep 1
done

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
