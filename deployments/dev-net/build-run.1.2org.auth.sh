#!/usr/bin/env bash

################################
# Build Auth-Server Image and Gw-Org Images
# Run local development networ, in docker-compose
################################
SECONDS=0
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
export IMAGE_TAG=1.4.3
export CONFIG=./config
export CHAINCODE=../../packages/chaincode
export MEMBERS="'EtcMSP.member','PbctfpMSP.member'"
export VERSION=1.0
export CRYPTO=/var/artifacts/crypto-config
export VOLUME=./volume
export ARTIFACTS=./artifacts
export SCRIPTS=./scripts
export COMPOSE_1=compose.1.2org.yaml
export COMPOSE_2=compose.2.2org.auth.yaml
export CURRENT_DIR=$PWD
export AUTH_IMAGE=espresso/auth-server:1.0
export ORG1_IMAGE=espresso/gw-org1:1.0
export ORG2_IMAGE=espresso/gw-org2:1.0

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

# STEP 0: Cleaup the environment
./cleanup.sh

# STEP 1
# Create crypto-material
# Create and join channel
# Install and instantiate chaincode

./bootstrap.2org.sh

# STEP 2
# create build context at ~/.build

cd ../.. && yarn build:auth
printMessage "Create build context for auth-server"  $?

# STEP 3
# build auth-server image
docker rmi $AUTH_IMAGE
DOCKER_BUILD=1 docker build --no-cache -f ./auth-server.dockerfile -t $AUTH_IMAGE .
printMessage "Create auth-server image" $?
sleep 1

# STEP 4
# start compose for local development
cd $CURRENT_DIR
docker-compose -f $COMPOSE_1 up -d
printMessage "Docker-compose up $COMPOSE_1" $?

sleep 1

# because of createsql script will take around 10 second to complete
# wait postgres container is up
canConnect=false
while [ "$canConnect"=false ]; do
    result=$(docker container exec -i postgres01 psql -h localhost -U postgres -d auth_db -lqt | cut -f 1 -d \| | grep -e "postgres")
    printf "."
    if [[ "postgres"="$result" ]]
    then
 canConnect=true
 printf "${GREEN}psql: connected to server postgres01${NC}\n"
 break
    fi
done

canConnect=false
while [ "$canConnect"=false ]; do
    result=$(docker container exec -i postgres02 psql -h localhost -U postgres -d auth_db -lqt | cut -f 1 -d \| | grep -e "postgres")
    printf "."
    if [[ "postgres"="$result" ]]
    then
 canConnect=true
 printf "${GREEN}psql: connected to server postgres02${NC}\n"
 break
    fi
done

sleep 1

docker-compose -f $COMPOSE_2 up -d
printMessage "Docker-compose up $COMPOSE_2" $?

#duration=$SECONDS
#printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.${NC}"
