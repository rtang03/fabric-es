#!/usr/bin/env bash
export COMPOSE=compose.2org.yaml
export ARTIFACTS=./artifacts
export VOLUME=./volume

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

# Cleaup the environment
docker rm -f logspout auth-server1 auth-server2
docker-compose -f $COMPOSE down
docker rm -f $(docker ps -aq -f status=exited)
#docker volume prune -f
#docker network prune -f

rm -rf $VOLUME
printMessage "Remove ${VOLUME}" $?

rm -rf $ARTIFACTS
printMessage "Remove ${ARTIFACTS}" $?

# Cleanup chaincode images
#docker rmi -f $(docker images | grep eventstore | awk '{print $3}')
#docker rmi -f $(docker images | grep privatedata | awk '{print $3}')
