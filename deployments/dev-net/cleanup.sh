#!/bin/bash

# Cleaup the environment
# Usage: cleanup.sh [-d | -R | --remove-cc-images] [docker-compose file]

. ./scripts/setup.sh

ORG_COUNT=`docker ps | grep gw-org | awk '{print $NF}' | wc -l`
COMPOSE_GATEWAY=
for ((i=1;i<=$ORG_COUNT;i++));
do
  COMPOSE_GATEWAY="$COMPOSE_GATEWAY -f compose.${i}org.gw.yaml"
done
COMPOSE="$COMPOSE_ORG $COMPOSE_CC $COMPOSE_DBRD $COMPOSE_AUTH $COMPOSE_GATEWAY $COMPOSE_NGX $COMPOSE_TST"

case $# in
  0)
    ;;
  1|2)
    case $1 in
      -d)
        if [ $# -gt 1 ]; then
          printMessage "Usage: cleanup.sh {-R | --remove-cc-images} {[docker-compose file]}; cleanup" 2
        fi
        ;;
      -f*)
        if [ $# -eq 1 ]; then
          COMPOSE=$1
        else
          printMessage "Usage: cleanup.sh {-R | --remove-cc-images} {[docker-compose file]}; cleanup" 1
        fi
        ;;
      *)
        printMessage "Usage: cleanup.sh {-R | --remove-cc-images} {[docker-compose file]}; cleanup" 3
        ;;
    esac
    ;;
  *)
    printMessage "Usage: cleanup.sh {-R | --remove-cc-images} {[docker-compose file]}; cleanup" 4
    ;;
esac

LOGSPOUT=`docker ps -a | grep logspout`
if [ ! -z "$LOGSPOUT" ]; then
  echo -n "Removing "
  docker rm -f logspout
fi

docker-compose $COMPOSE down
sleep 1

EXITED=`docker ps -aq -f status=exited`
if [ ! -z "$EXITED" ]; then
  docker rm -f $(docker ps -aq -f status=exited)
fi

docker volume prune -f
docker network prune -f

if [ $NEEDSUDO -eq 1 ]; then
  sudo rm -rf $VOLUME
  printMessage "Remove ${VOLUME}" $?

  sudo rm -rf $ARTIFACTS
  printMessage "Remove ${ARTIFACTS}" $?
else
  rm -fr $VOLUME
  printMessage "Remove ${VOLUME}" $?

  rm -rf $ARTIFACTS
  printMessage "Remove ${ARTIFACTS}" $?
fi

DANGLE=`docker images -qf "dangling=true"`
if [ ! -z "$DANGLE" ]; then
  echo "Cleaning up dangling docker images..."
  docker rmi $(docker images -qf "dangling=true")
fi
