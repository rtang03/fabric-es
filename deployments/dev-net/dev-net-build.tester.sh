#!/usr/bin/env bash

#######################################
# Build tester docker images
#######################################

. ./scripts/setup.sh

SECONDS=0

OPTION=-d
if [ $# -eq 1 ]; then
  OPTION=$1
fi
./cleanup.sh $OPTION

# STEP 1
printf "Cleaning up old image $TEST_IMAGE\n"
docker rmi $TEST_IMAGE

# STEP 2 - create build context
cd $ROOT_DIR && yarn build:tester
printMessage "Create build context for tester" $?
sleep 1

# STEP 3
DOCKER_BUILD=1 docker build --no-cache -f ./tester.dockerfile -t $TEST_IMAGE .
printMessage "Create image ${TEST_IMAGE}" $?
sleep 1

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
