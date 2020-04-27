#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

export RELEASE=0.6.2
export IMAGE_TAG=2.0.1
export CONFIG=./config
export VOLUME=./volume
export ARTIFACTS=./artifacts
export SCRIPTS=./scripts
export CRYPTO=/var/artifacts/crypto-config
export CURRENT_DIR=`pwd`

export AUTH_IMAGE=fabric-es/auth-server:${RELEASE}
export TEST_IMAGE=fabric-es/tester:${RELEASE}
export PROXY_IMAGE=fabric-es/proxy:{RELEASE}
export UI_ACCOUNT_IMAGE=fabric-es/ui-account:{RELEASE}
export ROOT_DIR=$CURRENT_DIR/../..

export CHAINCODE=../../packages/chaincode

export LIBS_DIR=$ROOT_DIR/node_modules
export CONF_DIR=$CURRENT_DIR/build.

export COMPOSE_0_2ORG="-f compose.2org.yaml"
export COMPOSE_1_2ORG="$COMPOSE_0_2ORG -f compose.2org.db.yaml"
export COMPOSE_2_2ORG="$COMPOSE_1_2ORG -f compose.2org.auth.yaml"
export COMPOSE_3_2ORG="$COMPOSE_2_2ORG -f compose.2org.gw.yaml"
export COMPOSE_4_2ORG="$COMPOSE_3_2ORG -f compose.2org.tester.yaml"
export COMPOSE_0_3ORG="$COMPOSE_0_2ORG -f compose.3org.yaml"
export COMPOSE_1_3ORG="$COMPOSE_0_3ORG -f compose.2org.db.yaml -f compose.3org.db.yaml"
export COMPOSE_2_3ORG="$COMPOSE_1_3ORG -f compose.2org.auth.yaml -f compose.3org.auth.yaml"
export COMPOSE_3_3ORG="$COMPOSE_2_3ORG -f compose.2org.gw.yaml -f compose.3org.gw.yaml"
export COMPOSE_4_3ORG="$COMPOSE_3_3ORG -f compose.3org.tester.yaml"

# $1 - message to be printed
# $2 - exit code of the previous operation
printMessage() {
  if [ $2 -ne 0 ] ; then
    printf "${RED}${1} failed${NC}\n"
    exit $2
  fi
  printf "${GREEN}Complete ${1}${NC}\n\n"
  sleep 1
}

# $1 - code of org (e.g. "org1")
getConfig() {
  case $1 in
    org0)
      NAME="Org0"
      PEER="orderer0 orderer1 orderer2 orderer3 orderer4"
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
      CCPORT=7052
      GATEWAY="gw-org1"
      IMAGE=fabric-es/gw-org1:1.0
      ;;
    org2)
      NAME="Org2"
      PEER="peer0"
      DOMAIN="org2.net"
      CAPORT=5055
      PORT=7251
      CCPORT=7252
      GATEWAY="gw-org2"
      IMAGE=fabric-es/gw-org2:1.0
      ;;
    org3)
      NAME="Org3"
      PEER="peer0"
      DOMAIN="org3.net"
      CAPORT=5056
      PORT=7451
      CCPORT=7452
      GATEWAY="gw-org3"
      IMAGE=fabric-es/gw-org3:1.0
      ;;
  esac
}

# $1 - container name
# $2 - expected | command if 3 arguments
# $3 - optional: expected
containerWait() {
  FOUND=false
  COUNT=60
  while [[ ("$FOUND"=false) && (COUNT -gt 0) ]]; do
    if [ $# -eq 3 ]; then
      RESULT=`docker container exec -i $1 "$2" | grep -e "$3"`
    else
      RESULT=`docker logs $1 | grep -e "$2"`
    fi
    echo -n "."
    if [ ! -z "$RESULT" ]; then
      FOUND=true
      printf "${GREEN}container ${1} ready${NC}\n"
      break
    fi
    COUNT=$(( COUNT - 1 ))
    sleep 1
  done
  if [ $COUNT -le 0 ]; then
    printf "${RED}waiting for container $1 timed out${NC}\n"
    exit 1
  fi
}

# $1 - script name
# $2 - options
parseArgs() {
  OPTION=-d
  if [ $# -eq 2 ]; then
    case $2 in
      -h|--help)
        echo "Usage: $1 {-R | --remove-cc-images | -h | --help}"
        exit 0
        ;;
      -R|--remove-cc-images)
        OPTION=$2
        ;;
    esac
  fi
}

