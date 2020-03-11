#!/usr/bin/env bash

SECONDS=0
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

export IMAGE_TAG=1.4.3
export CONFIG=./config
export CHAINCODE=../../packages/chaincode
export MEMBERS="'EtcMSP.member','PbctfpMSP.member'"
export VERSION=1.0
export CRYPTO=/var/artifacts/crypto-config
export VOLUME=./volume
export ARTIFACTS=./artifacts
export SCRIPTS=./scripts
export COMPOSE_1=compose.1.2org.yaml
export COMPOSE_2=compose.2.2org.auth.yaml
export COMPOSE_3=compose.3.2org.auth-gw.yaml
export CURRENT_DIR=$PWD
export AUTH_IMAGE=espresso/auth-server:1.0
export ORG1_IMAGE=espresso/gw-org1:1.0
export ORG2_IMAGE=espresso/gw-org2:1.0

printMessage() {
  MESSAGE=$1
  CODE=$2
  if [ $2 -ne 0 ] ; then
    printf "${RED}${MESSAGE} failed${NC}\n"
    exit -1
  fi
  printf "${GREEN}Complete ${MESSAGE}${NC}\n\n"
  sleep 1
}

# Step 1 to 4
./build-run.1.2org.auth.sh

# STEP 5
# create build context for gw-org1
cd $CURRENT_DIR
cd ../.. && yarn build:gw-dev-net:org1
printMessage "Create build context for gw-org1" $?
sleep 1

# STEP 6
docker rmi $ORG1_IMAGE
DOCKER_BUILD=1 docker build --no-cache -f ./gw-org1.dockerfile -t $ORG1_IMAGE .
printMessage "Create org1 image" $?
sleep 1

# STEP 7
# create build context for gw-org2
cd $CURRENT_DIR
cd ../.. && yarn build:gw-dev-net:org2
printMessage "Create build context for gw-org2" $?
sleep 1

# STEP 8
docker rmi $ORG2_IMAGE
DOCKER_BUILD=1 docker build --no-cache -f ./gw-org2.dockerfile -t $ORG2_IMAGE .
printMessage "Create org2 image" $?
sleep 1

# Step 9
cd $CURRENT_DIR
docker-compose -f $COMPOSE_3 up -d
printMessage "Docker-compose up $COMPOSE_3" $?

#duration=$SECONDS
#printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.${NC}"
