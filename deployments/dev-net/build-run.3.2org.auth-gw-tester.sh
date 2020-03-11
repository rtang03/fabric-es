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
export COMPOSE_4=compose.4.2org.auth-gw-tester.yaml
export CURRENT_DIR=$PWD
export AUTH_IMAGE=espresso/auth-server:1.0
export ORG1_IMAGE=espresso/gw-org1:1.0
export ORG2_IMAGE=espresso/gw-org2:1.0
export TESTER_IMAGE=espresso/tester:1.0

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

# step 1 to 9
./build-run.2.2org.auth-gw.sh

# step 10
cd $CURRENT_DIR
cd ../.. && yarn build:tester
docker rmi $TESTER_IMAGE
DOCKER_BUILD=1 docker build --no-cache -f ./tester.dockerfile -t $TESTER_IMAGE .
printMessage "Create tester image" $?
sleep 1

# step 11
cd $CURRENT_DIR
docker-compose -f $COMPOSE_4 up -d
printMessage "Docker-compose up $COMPOSE_4" $?

TEST_EXIT_CODE=`docker wait tester`;
docker logs tester
if [ -z ${TEST_EXIT_CODE+x} ] || [ "$TEST_EXIT_CODE" -ne 0 ] ; then
  printf "${RED}Tests Failed${NC} - Exit Code: $TEST_EXIT_CODE\n"
else
  printf "${GREEN}Tests Passed${NC}\n"
fi

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.${NC}\n\n"
