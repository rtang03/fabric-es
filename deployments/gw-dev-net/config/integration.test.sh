#!/usr/bin/env bash
docker-compose -f docker-compose.fabric_only.ci.yaml up --detach

canConnect=false
while [ "$canConnect"=false ]; do
    result=$(docker container exec -i integration_db psql -h localhost -U integration_user -d integration_db -lqt | cut -f 1 -d \| | grep -e "integration_db")
    printf "."
    if [[ "integration_db"="$result" ]]
    then
 canConnect=true
 break
    fi
done

yarn test

docker-compose -f docker-compose.fabric_only.ci.yaml down
