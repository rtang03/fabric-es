#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

export RELEASE=0.6.5
export IMAGE_TAG=2.1.0
export CONFIG=./config
export VOLUME=./volume
export ARTIFACTS=./artifacts
export SCRIPTS=./scripts
export CRYPTO=/var/artifacts/crypto-config
export CURRENT_DIR=`pwd`
export AUTH_IMAGE=fabric-es/auth-server:${RELEASE}
export TEST_IMAGE=fabric-es/tester:${RELEASE}
export PROXY_IMAGE=fabric-es/proxy:${RELEASE}
export UI_CONTROL_IMAGE=fabric-es/ui-control
export ROOT_DIR=$CURRENT_DIR/../..
export LOG_LEVEL=info
export LOG_TARGET=console

export CHAINCODE=$ROOT_DIR/packages/chaincode

export LIBS_DIR=$ROOT_DIR/node_modules
export CONF_DIR=$CURRENT_DIR/build.

export NGX_TEMPLATE_A_U_G=./scripts/nginx/auth-ui-gw.template
export NGX_TEMPLATE_A_U=./scripts/nginx/auth-ui.template
export NGX_TEMPLATE_A=./scripts/nginx/auth.template

export COMPOSE_1_NGX="-f compose.1org.ngx.yaml"
export COMPOSE_2_NGX="$COMPOSE_1_NGX -f compose.2org.ngx.yaml"
export COMPOSE_3_NGX="$COMPOSE_2_NGX -f compose.3org.ngx.yaml"

export COMPOSE_0_S="-f compose.1org.db-red.yaml"
export CMP_2_SRV="$COMPOSE_0_S -f compose.2org.db-red.yaml"
export CMP_3_SRV="$CMP_2_SRV -f compose.3org.db-red.yaml"
export CMP_1_ATH="-f compose.1org.auth.yaml"
export CMP_2_ATH="$CMP_1_ATH -f compose.2org.auth.yaml"
export CMP_3_ATH="$CMP_2_ATH -f compose.3org.auth.yaml"
export CMP_1_UIA="-f compose.1org.ui.yaml"
export CMP_2_UIA="$CMP_1_UIA -f compose.2org.ui.yaml"
export CMP_3_UIA="$CMP_2_UIA -f compose.3org.ui.yaml"
export CMP_1_GWY="-f compose.1org.gw.yaml"
export CMP_2_GWY="$CMP_1_GWY -f compose.2org.gw.yaml"
export CMP_3_GWY="$CMP_2_GWY -f compose.3org.gw.yaml"
export CMP_1_RLY="-f compose.1org.rl.yaml"
export CMP_2_RLY="$CMP_1_RLY -f compose.2org.rl.yaml"
export CMP_3_RLY="$CMP_2_RLY -f compose.3org.rl.yaml"
export CMP_RTEST="-f compose.3org.rltest.yaml"

export COMPOSE_0_S_A="$COMPOSE_0_S $CMP_1_ATH"
export COMPOSE_0_S_A_U="$COMPOSE_0_S_A $CMP_1_UIA"

export COMPOSE_1="-f compose.1org.yaml"
export COMPOSE_2="$COMPOSE_1 -f compose.2org.yaml"
export COMPOSE_3="$COMPOSE_2 -f compose.3org.yaml"

export COMPOSE_1_S="$COMPOSE_1 $COMPOSE_0_S"
export COMPOSE_1_S_A="$COMPOSE_1_S $CMP_1_ATH"
export COMPOSE_1_S_A_U="$COMPOSE_1_S_A $CMP_1_UIA"
export COMPOSE_1_S_A_U_G="$COMPOSE_1_S_A_U $CMP_1_GWY"
export COMPOSE_1_S_A_R="$COMPOSE_1_S_A $CMP_1_RLY"

export COMPOSE_2_S="$COMPOSE_2 $CMP_2_SRV"
export COMPOSE_2_S_A="$COMPOSE_2_S $CMP_2_ATH"
export COMPOSE_2_S_A_U="$COMPOSE_2_S_A $CMP_2_UIA"
export COMPOSE_2_S_A_U_G="$COMPOSE_2_S_A_U $CMP_2_GWY"
export COMPOSE_2_S_A_G="$COMPOSE_2_S_A $CMP_2_GWY"
export COMPOSE_2_S_A_G_T="$COMPOSE_2_S_A_G -f compose.2org.gwtest.yaml"
export COMPOSE_2_S_A_R="$COMPOSE_2_S_A $CMP_2_RLY"

export COMPOSE_3_S="$COMPOSE_3 $CMP_3_SRV"
export COMPOSE_3_S_A="$COMPOSE_3_S $CMP_3_ATH"
export COMPOSE_3_S_A_U="$COMPOSE_3_S_A $CMP_3_UIA"
export COMPOSE_3_S_A_U_G="$COMPOSE_3_S_A_U $CMP_3_GWY"
export COMPOSE_3_S_A_G="$COMPOSE_3_S_A $CMP_3_GWY"
export COMPOSE_3_S_A_G_T="$COMPOSE_3_S_A_G -f compose.3org.gwtest.yaml"
export COMPOSE_3_S_A_R="$COMPOSE_3_S_A $CMP_3_RLY"
export COMPOSE_3_S_A_R_T="$COMPOSE_3_S_A_R $CMP_RTEST"

export COMPOSE_ALL="$COMPOSE_3_S_A_G_T $CMP_3_UIA $COMPOSE_3_NGX $CMP_3_RLY $CMP_RTEST"

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
      ;;
    org1)
      NAME="Org1"
      PEER="peer0"
      DOMAIN="org1.net"
      CAPORT=5054
      PORT=7051
      CCPORT=7052
      ;;
    org2)
      NAME="Org2"
      PEER="peer0"
      DOMAIN="org2.net"
      CAPORT=5055
      PORT=7251
      CCPORT=7252
      ;;
    org3)
      NAME="Org3"
      PEER="peer0"
      DOMAIN="org3.net"
      CAPORT=5056
      PORT=7451
      CCPORT=7452
      ;;
  esac
}

# $1 - container name
# $2 - expected | command if 3 arguments
# $3 - optional: expected
containerWait() {
  FOUND=false
  COUNT=90
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
  OPTION=-d # default cleanup operation (?)
  COMPOSE=0 # do not run docker-compose only
  if [ $# -eq 2 ]; then
    case $2 in
      -h|--help)
        echo "Usage: $1 {-R | --remove-cc-images | -h | --help}"
        exit 0
        ;;
      -R|--remove-cc-images)
        OPTION=$2
        ;;
      -C|--compose-only)
        COMPOSE=1
        ;;
    esac
  fi
}

