#!/usr/bin/env bash

SECONDS=0
CURRENT_DIR=$PWD
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

./cleanup.sh

./bootstrap.2org.sh

cd ../.. && yarn unit-test:fab

cd $CURRENT_DIR

./shutdown-cleanup.sh

duration=$SECONDS
echo "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.${NC}"
