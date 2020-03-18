#!/usr/bin/env bash

exportRED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

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

export VERSION=1.0
export IMAGE_TAG=1.4.3
export CONFIG=./config
export VOLUME=./volume
export ARTIFACTS=./artifacts
export SCRIPTS=./scripts
export CHAINCODE=../../packages/chaincode
export CRYPTO=/var/artifacts/crypto-config
export CURRENT_DIR=$PWD
export ROOT_DIR=$PWD/../..
export COMPOSE_1=compose.1.3org.yaml
export COMPOSE_2=compose.2.3org.auth.yaml
export COMPOSE_3=compose.3.3org.auth-gw.yaml
export MEMBERS="'Org1MSP.member','Org2MSP.member','Org3MSP.member'"
export AUTH_IMAGE=fabric-es/auth-server:1.0
export ORG1_IMAGE=fabric-es/gw-org1:1.0
export ORG2_IMAGE=fabric-es/gw-org2:1.0
export ORG3_IMAGE=fabric-es/gw-org3:1.0
