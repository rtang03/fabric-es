#!/usr/bin/env bash

################################
# Build Auth-Server Image and Gw-Org Images
# Run local development networ, in docker-compose
################################
. ./setup.sh

SECONDS=0

# STEP 0: Cleaup the environment
./cleanup.sh

# STEP 1
# Create crypto-material
# Create and join channel
# Install and instantiate chaincode
./bootstrap.2org.sh

# STEP 2
# create build context at ~/.build
cd $ROOT_DIR && yarn build:auth
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
    sleep 1
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
    sleep 1
done

docker-compose -f $COMPOSE_2 up -d
printMessage "Docker-compose up $COMPOSE_2" $?

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.${NC}"
