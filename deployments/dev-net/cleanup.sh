#!/usr/bin/env bash
export COMPOSE=compose.2org.yaml
export ARTIFACTS=./artifacts

# Cleaup the environment
docker rm -f logspout
docker-compose -f $COMPOSE down --volumes
docker rm -f $(docker ps -aq -f status=exited)
#docker volume prune -f
#docker network prune -f
rm -rf $ARTIFACTS

# Cleanup chaincode images
#docker rmi -f $(docker images | grep eventstore | awk '{print $3}')
#docker rmi -f $(docker images | grep privatedata | awk '{print $3}')
