#!/usr/bin/env bash

################################
# Build Auth-Server Image and
# Run local development network
# in docker-compose
################################

. ./setup.sh

export VOLUME=./volume.auth
export ARTIFACTS=./artifacts.auth
export COMPOSE=compose.auth-server.yaml

# create build context at ~/.build
cd $ROOT_DIR && yarn build:auth

printMessage "Create build context"  $?

# build auth-server image
docker rmi fabric-es/auth-server:1.0

DOCKER_BUILD=1 docker build --no-cache -f ./auth-server.dockerfile -t fabric-es/auth-server:1.0 .

printMessage "Create auth-server image" $?

# Cleaup the environment
cd $CURRENT_DIR

docker-compose -f $COMPOSE down --volumes

docker rm -f $(docker ps -aq -f status=exited)

rm -rf $ARTIFACTS
rm -rf $VOLUME

# Start the auth-server
docker-compose -f $COMPOSE up -d

printMessage "Docker-compose up" $?

sleep 1

# because of createsql script will take around 10 second to complete
# wait postgres container is up
canConnect=false
while [ "$canConnect"=false ]; do
    result=$(docker container exec -i postgres01 psql -h localhost -U postgres -d postgres -lqt | cut -f 1 -d \| | grep -e "postgres")
    printf "."
    if [[ "postgres"="$result" ]]
    then
 canConnect=true
 printf "${GREEN}psql: connected to server${NC}\n"
 break
    fi
done

sleep 1
