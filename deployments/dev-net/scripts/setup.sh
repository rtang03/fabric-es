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
export PROXY_IMAGE=fabric-es/proxy:${RELEASE}
export UI_ACCOUNT_IMAGE=fabric-es/ui-account:${RELEASE}
export ROOT_DIR=$CURRENT_DIR/../..

export CHAINCODE=$ROOT_DIR/packages/chaincode

export LIBS_DIR=$ROOT_DIR/node_modules
export CONF_DIR=$CURRENT_DIR/build.

export COMPOSE_0_1ORG="-f compose.1org.yaml"
export COMPOSE_0_2ORG="$COMPOSE_0_1ORG -f compose.2org.yaml"
export COMPOSE_0_3ORG="$COMPOSE_0_2ORG -f compose.3org.yaml"
export CMP_1_SRV="-f compose.1org.px-db-red.yaml"
export CMP_2_SRV="$CMP_1_SRV -f compose.2org.px-db-red.yaml"
export CMP_3_SRV="$CMP_2_SRV -f compose.3org.px-db-red.yaml"
export CMP_1_ATH="-f compose.1org.auth.yaml"
export CMP_2_ATH="$CMP_1_ATH -f compose.2org.auth.yaml"
export CMP_3_ATH="$CMP_2_ATH -f compose.3org.auth.yaml"
export CMP_1_UIA="-f compose.1org.ui.yaml"
export CMP_2_UIA="$CMP_1_UIA -f compose.2org.ui.yaml"
export CMP_3_UIA="$CMP_2_UIA -f compose.3org.ui.yaml"
export CMP_1_GWY="-f compose.1org.gw.yaml"
export CMP_2_GWY="$CMP_1_GWY -f compose.2org.gw.yaml"
export CMP_3_GWY="$CMP_2_GWY -f compose.3org.gw.yaml"

export COMPOSE_0_0ORG="$CMP_1_SRV"
export COMPOSE_1_0ORG="$COMPOSE_0_0ORG $CMP_1_ATH"
export COMPOSE_2_0ORG="$COMPOSE_1_0ORG $CMP_1_UIA"

export COMPOSE_1_1ORG="$COMPOSE_0_1ORG $CMP_1_SRV"
export COMPOSE_2_1ORG="$COMPOSE_1_1ORG $CMP_1_ATH"
export COMPOSE_3_1ORG="$COMPOSE_2_1ORG $CMP_1_UIA"
export COMPOSE_4_1ORG="$COMPOSE_3_1ORG $CMP_1_GWY"
export COMPOSE_5_1ORG="$COMPOSE_2_1ORG $CMP_1_GWY -f compose.1org.tester.yaml"

export COMPOSE_1_2ORG="$COMPOSE_0_2ORG $CMP_2_SRV"
export COMPOSE_2_2ORG="$COMPOSE_1_2ORG $CMP_2_ATH"
export COMPOSE_3_2ORG="$COMPOSE_2_2ORG $CMP_2_UIA"
export COMPOSE_4_2ORG="$COMPOSE_3_2ORG $CMP_2_GWY"
export COMPOSE_5_2ORG="$COMPOSE_2_2ORG $CMP_2_GWY -f compose.2org.tester.yaml"

export COMPOSE_1_3ORG="$COMPOSE_0_3ORG $CMP_3_SRV"
export COMPOSE_2_3ORG="$COMPOSE_1_3ORG $CMP_3_ATH"
export COMPOSE_3_3ORG="$COMPOSE_2_3ORG $CMP_3_UIA"
export COMPOSE_4_3ORG="$COMPOSE_3_3ORG $CMP_3_GWY"
export COMPOSE_5_3ORG="$COMPOSE_2_3ORG $CMP_3_GWY -f compose.3org.tester.yaml"

export COMPOSE_ALL="$COMPOSE_5_3ORG $CMP_1_UIA $CMP_2_UIA $CMP_3_UIA"

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
      ;;
    org1)
      NAME="Org1"
      PEER="peer0"
      DOMAIN="org1.net"
      CAPORT=5054
      PORT=7051
      CCPORT=7052
      GATEWAY="gw-org1"
      ;;
    org2)
      NAME="Org2"
      PEER="peer0"
      DOMAIN="org2.net"
      CAPORT=5055
      PORT=7251
      CCPORT=7252
      GATEWAY="gw-org2"
      ;;
    org3)
      NAME="Org3"
      PEER="peer0"
      DOMAIN="org3.net"
      CAPORT=5056
      PORT=7451
      CCPORT=7452
      GATEWAY="gw-org3"
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
      RESULT=`docker logs $1 2>&1 | grep -e "$2"`
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

