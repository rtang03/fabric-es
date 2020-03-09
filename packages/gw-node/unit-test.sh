#!/usr/bin/env bash
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

docker run -d \
  -e POSTGRES_PASSWORD=docker \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=postgres \
  --name postgres-gw-node -p 5432:5432 postgres:9.6.17-alpine

if [ $? -ne 0 ] ; then
  printf "${RED}Docker Compose Failed${NC}\n"
  exit -1
fi

canConnect=false
while [ "$canConnect"=false ]; do
    result=$(docker container exec -i postgres-gw-node psql -h localhost -U postgres -d postgres -lqt | cut -f 1 -d \| | grep -e "postgres")
    printf "."
    if [[ "postgres"="$result" ]]
    then
 canConnect=true
 printf "${GREEN}psql: connected to server${NC}\n"
 break
    fi
done

printf "${GREEN}enrollAdmin ...${NC}\n"
yarn enrollAdmin

printf "${GREEN}enrollCaAdmin ...${NC}\n"
yarn enrollCaAdmin

yarn test:admin-service

printf "${GREEN}unit-test:admin-service done${NC}\n"

printf "attemp to remove docker...  "

docker rm postgres-gw-node -f

printf "${GREEN}remove docker container: postgres-gw-node${NC}\n"
