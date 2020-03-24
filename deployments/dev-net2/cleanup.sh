#!/usr/bin/env bash

# Cleaup the environment

. ./scripts/setup.sh

COMPOSE=$COMPOSE_3_3ORG
if [ $# -eq 1 ]; then
  COMPOSE=$1
fi

LOGSPOUT=`docker ps -a | grep logspout`
if [ ! -z "$LOGSPOUT" ]; then
  echo -n "Removing "
  docker rm -f logspout
fi

docker-compose $COMPOSE down

EXITED=`docker ps -aq -f status=exited`
if [ ! -z "$EXITED" ]; then
  docker rm -f $(docker ps -aq -f status=exited)
fi

docker volume prune -f
docker network prune -f

rm -rf $VOLUME
printMessage "Remove ${VOLUME}" $?

rm -rf $ARTIFACTS
printMessage "Remove ${ARTIFACTS}" $?

# Cleanup chaincode images
#docker rmi -f $(docker images | grep eventstore | awk '{print $3}')
#docker rmi -f $(docker images | grep privatedata | awk '{print $3}')
