#!/usr/bin/env bash

################################
# Run local development network
################################

# note: this is similar to ./run-unit-test.sh, but the cleanup step is not necessary here.

. ./setup.sh

COMPOSE="-f $COMPOSE_2ORG -f $COMPOSE_2ORG_AUTH"
SECONDS=0

./cleanup.sh "$COMPOSE"

if [[ ( $# -ge 0 ) && ( $1 = "-d" || $1 = "--down" ) ]]; then
  exit $?
fi

# STEP 1
./bootstrap.3org.sh "$COMPOSE"

# STEP 2
canConnect=false
while [ "$canConnect"=false ]; do
    result=$(docker container exec -i postgres01 psql -h localhost -U postgres -d auth_db -lqt | cut -f 1 -d \| | grep -e "postgres")
    printf "."
    if [[ "postgres"="$result" ]]; then
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
    if [[ "postgres"="$result" ]]; then
      canConnect=true
      printf "${GREEN}psql: connected to server postgres02${NC}\n"
      break
    fi
    sleep 1
done

docker-compose $COMPOSE up -d
printMessage "Docker-compose up $COMPOSE" $?

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
