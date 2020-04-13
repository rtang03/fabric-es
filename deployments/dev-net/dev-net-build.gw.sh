#!/usr/bin/env bash

#######################################
# Build gw-orgX docker images
# $@ - list of orgs (e.g. "org1 org2")
#######################################

if [[ ( $# -eq 1 ) && ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: ./dev-net-build.gw.sh [org code 1] {[org code 2] {[org code 3]}}"
  exit 0
fi

. ./scripts/setup.sh

SECONDS=0

./cleanup.sh

for ORG in "$@"
do
  getConfig $ORG

  # STEP 1
  printf "Cleaning up old image $IMAGE\n"
  docker rmi $IMAGE

  # STEP 2 - create build context
  cd $ROOT_DIR && yarn build:gw-dev-net:${ORG}
  printMessage "Create build context for gw-${ORG}" $?
  sleep 1

  # STEP 3
  DOCKER_BUILD=1 docker build --no-cache -f ./gw-${ORG}.dockerfile -t $IMAGE .
  printMessage "Create image ${IMAGE}" $?
  sleep 1
done

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
