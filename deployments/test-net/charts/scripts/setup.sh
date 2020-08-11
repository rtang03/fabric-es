#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

export ROOT_DIR=`pwd`/../../..
export CHAINCODE=$ROOT_DIR/packages/chaincode

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

preventEmptyValue() {
  if [ -z $2 ]
  then
  printf "No content error: $1 \n"
  exit -1
  fi
}

