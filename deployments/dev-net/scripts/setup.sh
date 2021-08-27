#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Check Release Version from package.json
if [ -f ../../package.json ]
then
  RELEASE_VERSION=`cat ../../package.json | grep \"version\" | awk '{print $2}' | awk -F'"' '{print $2}'`
else
  RELEASE_VERSION=1.0.0
fi

# check if linux user to use sudo in shellscript
NEEDSUDO=1
if [[ "$OSTYPE" == "darwin"* ]]; then
  NEEDSUDO=0
fi

export CURRENT_UID=$(id -u):$(id -g)
export RELEASE=${RELEASE_VERSION}
export CONFIG=./config
export VOLUME=./volume
export ARTIFACTS=./artifacts
export SCRIPTS=./scripts
export CRYPTO=/var/artifacts/crypto-config
export CURRENT_DIR=`pwd`
export ROOT_DIR=$CURRENT_DIR/../..

# HTTPS related
export CERTS=/Users/paul/cert/local
export CERT_PUB=/cert/org0.crt
export CERT_PRV=/cert/org0.key

export HLF_VERSION=2.2.0
export HLF_CA_IMAGE=hyperledger/fabric-ca:1.4.8
export HLF_ORDERER_IMAGE=hyperledger/fabric-orderer:$HLF_VERSION
export HLF_PEER_IMAGE=hyperledger/fabric-peer:$HLF_VERSION
export HLF_TOOLS_IMAGE=hyperledger/fabric-tools:$HLF_VERSION
export AUTH_IMAGE=ghcr.io/rtang03/auth-server:0.0.3
export CC_IMAGE=ghcr.io/rtang03/eventstore-cc:0.0.6
export POSTGRES_IMAGE=postgres:9.6.17-alpine
export REDISEARCH_IMAGE=redislabs/redisearch:2.0.5
export NGX_IMAGE=nginx:alpine

export LOG_LEVEL=info
export LOG_TARGET=console

export LIBS_DIR=$ROOT_DIR/node_modules
export CONF_DIR=$CURRENT_DIR/build.

export NGX_TEMPLATE=$ARTIFACTS/ngx.conf.template

export COMPOSE_ORG="-f compose.orderer.yaml -f compose.org.yaml"
export COMPOSE_CC="-f compose.cc.yaml"
export COMPOSE_DBRD="-f compose.db-red.yaml"
export COMPOSE_AUTH="-f compose.auth.yaml"
export COMPOSE_NGX="-f compose.ngx.yaml"
export COMPOSE_TST="-f compose.tester.yaml"

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
  local __INPUT=$1
  local __ORG_NO=${__INPUT:3}
  case $1 in
    org0)
      NAME="Org0"
      PEER="orderer0"
      LIST="orderer0 orderer1 orderer2 orderer3 orderer4"
      DOMAIN="org0.com"
      CAPORT=5052
      PORT=7050
      ;;
    *)
      NAME="Org${__ORG_NO}"
      PEER="peer0"
      DOMAIN="org${__ORG_NO}.net"
      CAPORT=$((__ORG_NO*100+5053))
      PORT=$((__ORG_NO*100+7051))
      ;;
  esac
}

# $1 - order number (eg. 3)
getTmplParams() {
  local __ORG_NO=$1
  TMPL_PARAM_ID=$((__ORG_NO))
  TMPL_PARAM_ORG_NAME="org${__ORG_NO}"
  TMPL_PARAM_ORG_MSP="Org${__ORG_NO}MSP"
  TMPL_PARAM_RCA_PORT=$((__ORG_NO*100+5053))
  TMPL_PARAM_PEER_PORT=$((__ORG_NO*100+7051))
  TMPL_PARAM_CC_PORT=$((__ORG_NO*100+7052))
  TMPL_PARAM_EVENT_URL_PORT=$((__ORG_NO*100+7053))
  TMPL_PARAM_AUTH_PORT=$((__ORG_NO*1+8080))
  TMPL_PARAM_REDIS_PORT=$((__ORG_NO*1+6378))
  TMPL_PARAM_NGX_PORT=$((__ORG_NO*1+3000))
}

# $1 - container name
# $2 - expected | command if 3 arguments
# $3 - optional: expected
containerWait() {
  FOUND=false
  COUNT=180
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

# $1 - count
# $2 - container name
# $3 - expected | command if 3 arguments
# $4 - optional: expected
containersWait() {
  for ((i=1;i<=$1;i++));
  do
    containerWait $2$i $3 $4
  done
}

# $1 - script name
# $2 - options
parseArgs() {
  OPTION=-d  # default cleanup operation (?)
  COMPOSE=0  # run docker-compose only, skip bootstrap
  TESTONLY=0 # run docker-compose for tester only
  CLEANUP=1  # run cleaup after tester finish
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
      -T|--test-only)
        COMPOSE=1
        TESTONLY=1
        ;;
      -U|--no-cleanup)
        CLEANUP=0
        ;;
    esac
  fi
}
