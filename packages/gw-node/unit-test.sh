#!/usr/bin/env bash
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

docker run -d \
  -e POSTGRES_PASSWORD=docker \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=postgres \
  --name postgres-dev -p 5432:5432 postgres:9.6.17-alpine

if [ $? -ne 0 ] ; then
  printf "${RED}Docker Compose Failed${NC}\n"
  exit -1
fi

canConnect=false
while [ "$canConnect"=false ]; do
    result=$(docker container exec -i postgres-dev psql -h localhost -U postgres -d postgres -lqt | cut -f 1 -d \| | grep -e "postgres")
    printf "."
    if [[ "postgres"="$result" ]]
    then
 canConnect=true
 printf "${GREEN}psql: connected to server${NC}\n"
 break
    fi
done

yarn test:all

printf "${GREEN}authentication:unit-test done${NC}\n"

docker rm postgres-dev -f

printf "${GREEN}remove docker container: postgres-dev${NC}\n"
