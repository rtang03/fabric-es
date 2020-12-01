#!/bin/bash

#######################################
# Build relay docker image
# $@ - list of orgs (e.g. "org1 org2")
#######################################

if [[ ( $# -eq 1 ) && ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: ./dn-build.relay.sh"
  exit 0
fi

. ./scripts/setup.sh

SECONDS=0

./cleanup.sh

for ORG in "$@"
do
  printf "Cleaning up old image fabric-es/rl-${ORG}:${RELEASE}\n"
  docker rmi fabric-es/rl-${ORG}:${RELEASE}

  printf "Creating build context of rl-${ORG} ...\n"
  cd $CURRENT_DIR
  ./build-relay.sh $ORG

  printMessage "Create build context for rl-${ORG}"  $?
  sleep 1

  ### build image ###
  cd $ROOT_DIR
  set -x
  DOCKER_BUILD=1 docker build --no-cache -f ./rl-${ORG}.dockerfile -t fabric-es/rl-${ORG}:${RELEASE} .
  res=$?
  docker tag fabric-es/rl-${ORG}:${RELEASE} fabric-es/rl-${ORG}
  set +x
  printMessage "Create image fabric-es/rl-${ORG}:${RELEASE}" $?
  sleep 1
done

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
