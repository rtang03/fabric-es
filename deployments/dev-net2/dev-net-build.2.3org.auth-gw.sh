#!/usr/bin/env bash

. ./setup.sh

SECONDS=0

# Steps 1 to 4
./dev-net-build.1.3org.auth.sh

# STEP 5
# create build context for gw-org1
cd $ROOT_DIR && yarn build:gw-dev-net:org1
printMessage "Create build context for gw-org1" $?
sleep 1

# STEP 6
docker rmi $ORG1_IMAGE
DOCKER_BUILD=1 docker build --no-cache -f ./gw-org1.dockerfile -t $ORG1_IMAGE .
printMessage "Create org1 image" $?
sleep 1

# STEP 7
# create build context for gw-org2
cd $ROOT_DIR && yarn build:gw-dev-net:org2
printMessage "Create build context for gw-org2" $?
sleep 1

# STEP 8
docker rmi $ORG2_IMAGE
DOCKER_BUILD=1 docker build --no-cache -f ./gw-org2.dockerfile -t $ORG2_IMAGE .
printMessage "Create org2 image" $?
sleep 1

# STEP 9
# create build context for gw-org3
cd $ROOT_DIR && yarn build:gw-dev-net:org3
printMessage "Create build context for gw-org3" $?
sleep 1

# STEP 10
docker rmi $ORG3_IMAGE
DOCKER_BUILD=1 docker build --no-cache -f ./gw-org3.dockerfile -t $ORG3_IMAGE .
printMessage "Create org3 image" $?
sleep 1

# STEP 11
cd $CURRENT_DIR
docker-compose -f $COMPOSE_3 up -d
printMessage "Docker-compose up $COMPOSE_3" $?

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.${NC}"
