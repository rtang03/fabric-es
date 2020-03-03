#!/usr/bin/env bash
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
 echo psql: connected to server
 break
    fi
done

yarn test:all

echo authentication:unit-test done

docker rm postgres-dev -f

echo remove docker container: postgres-dev
