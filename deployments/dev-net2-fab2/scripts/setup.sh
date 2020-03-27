#!/usr/bin/env bash

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# $1 - message to be printed
# $2 - exit code of the previous operation
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

# $1 - code of org (e.g. "org1")
getConfig() {
  case $1 in
    org0)
      NAME="Org0"
      PEER="orderer0"
      DOMAIN="org0.com"
      CAPORT=5052
      PORT=7050
      GATEWAY="-"
      IMAGE="-"
      ;;
    org1)
      NAME="Org1"
      PEER="peer0"
      DOMAIN="org1.net"
      CAPORT=5054
      PORT=7051
      GATEWAY="gw-org1"
      IMAGE=fabric-es/gw-org1:1.0
      ;;
    org2)
      NAME="Org2"
      PEER="peer0"
      DOMAIN="org2.net"
      CAPORT=5055
      PORT=7251
      GATEWAY="gw-org2"
      IMAGE=fabric-es/gw-org2:1.0
      ;;
    org3)
      NAME="Org3"
      PEER="peer0"
      DOMAIN="org3.net"
      CAPORT=5056
      PORT=7451
      GATEWAY="gw-org3"
      IMAGE=fabric-es/gw-org3:1.0
      ;;
  esac
}

# $1 - container name
# $2 - command
# $3 - expected
containerWait() {
  FOUND=false
  COUNT=30
  while [[ ("$FOUND"=false) && (COUNT -gt 0) ]]; do
    RESULT=$(docker container exec -i $1 "$2" | grep -e "$3")
    echo -n "."
    if [ ! -z "$RESULT" ]; then
      FOUND=true
      printf "${GREEN}psql: connected to server ${1}${NC}\n"
      break
    fi
    COUNT=$(( COUNT - 1 ))
    sleep 1
  done
  if [ $COUNT -le 0 ]; then
    printf "${RED}waiting for container $1 timed out${NC}\n"
  fi
}

export VERSION=1.0
export IMAGE_TAG=2.0.1
export CONFIG=./config
export VOLUME=./volume
export ARTIFACTS=./artifacts
export SCRIPTS=./scripts
export CHAINCODE=../../packages/chaincode
export CRYPTO=/var/artifacts/crypto-config
export CURRENT_DIR=$PWD
export ROOT_DIR=$PWD/../..
export MEMBERS="'Org1MSP.member','Org2MSP.member'"

export AUTH_IMAGE=fabric-es/auth-server:1.0

export COMPOSE_2ORG=compose.2org.yaml
export COMPOSE_2ORG_AUTH=compose.2org.auth.yaml
export COMPOSE_2ORG_GW=compose.2org.gw.yaml
export COMPOSE_3ORG=compose.3org.yaml
export COMPOSE_3ORG_AUTH=compose.3org.auth.yaml
export COMPOSE_3ORG_GW=compose.3org.gw.yaml
