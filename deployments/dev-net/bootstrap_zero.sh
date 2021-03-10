#!/bin/bash


################################################################
# Run local development network with no blockchain network
################################################################
if [[ ( $# -ne 0 ) && ( $# -ne 1 ) || ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: $0 [option]"
  echo "{option} : option to additionally startup docker images \"auth\""
  exit 0
fi

if [[ ! -z $1 && $1 != "auth" ]]; then
  echo "invalid arg {auth} : $1!!! only accept \"auth\""
  exit 0
fi

. ./scripts/setup.sh

./cleanup.sh

ORG_COUNT=1

# STEP 0 Gen blockchain config oand docker-compose file
./build-config.sh $ORG_COUNT "auth"

# STEP 1
GEN_COMPOSE="$COMPOSE_DBRD"
docker-compose $GEN_COMPOSE up -d --no-recreate
printMessage "docker-compose up $GEN_COMPOSE" $?
containersWait $ORG_COUNT "postgres" "init process complete"
containersWait $ORG_COUNT "redis" "init process complete"

# STEP 2
if [[ ! -z $1 ]]; then
  GEN_COMPOSE="$GEN_COMPOSE $COMPOSE_AUTH"
  docker-compose $GEN_COMPOSE up -d --no-recreate
  printMessage "docker-compose up $GEN_COMPOSE" $?
  containersWait $ORG_COUNT "auth-server" "Auth server started"
fi
