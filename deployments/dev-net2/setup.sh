#!/usr/bin/env bash

RED='\033[0;31m'
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

getName() {
  case $1 in
    org0)
      NAME="Org0"
      DOMAIN="org0.com"
      PEER="orderer0"
      PORT=7050
      GATEWAY="-"
      ;;
    org1)
      NAME="Org1"
      DOMAIN="org1.net"
      PEER="peer0"
      PORT=7051
      GATEWAY="gw-org1"
      ;;
    org2)
      NAME="Org2"
      DOMAIN="org2.net"
      PEER="peer0"
      PORT=7251
      GATEWAY="gw-org2"
      ;;
    org3)
      NAME="Org3"
      DOMAIN="org3.net"
      PEER="peer0"
      PORT=7451
      GATEWAY="gw-org3"
      ;;
  esac
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
export MEMBERS="'Org1MSP.member','Org2MSP.member','Org3MSP.member'"
export AUTH_IMAGE=fabric-es/auth-server:1.0
export ORG1_IMAGE=fabric-es/gw-org1:1.0
export ORG2_IMAGE=fabric-es/gw-org2:1.0
export ORG3_IMAGE=fabric-es/gw-org3:1.0

export COMPOSE_2ORG=compose.2org.yaml
export COMPOSE_2ORG_AUTH=compose.2org.auth.yaml
export COMPOSE_2ORG_GW=compose.2org.gw.yaml
export COMPOSE_3ORG=compose.3org.yaml
export COMPOSE_3ORG_AUTH=compose.3org.auth.yaml
export COMPOSE_3ORG_GW=compose.3org.gw.yaml
