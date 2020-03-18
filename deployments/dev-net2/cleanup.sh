#!/usr/bin/env bash

. ./setup.sh

# Cleaup the environment
docker rm -f logspout auth-server1 auth-server2 auth-server3 gw-org1 gw-org2 gw-org3
docker-compose -f $COMPOSE_1 down
docker rm -f $(docker ps -aq -f status=exited)
docker volume prune -f
docker network prune -f

rm -rf $VOLUME
printMessage "Remove ${VOLUME}" $?

rm -rf $ARTIFACTS
printMessage "Remove ${ARTIFACTS}" $?

# Cleanup chaincode images
#docker rmi -f $(docker images | grep eventstore | awk '{print $3}')
#docker rmi -f $(docker images | grep privatedata | awk '{print $3}')
