#!/bin/bash

rm -rf data/*
docker-compose -f config/db.yaml up -d

# because of createsql script will take around 10 second to complete
# wait postgres container is up
sleep 15
while [ true ]; do

    result1=$(docker exec -i postgres-1 psql -h localhost -U postgres -d postgres -lqt | cut -f 1 -d\| | grep -e "postgres" | sed -e 's/^[[:space:]]*//')
    result2=$(docker exec -i postgres-2 psql -h localhost -U postgres -d postgres -lqt | cut -f 1 -d\| | grep -e "postgres" | sed -e 's/^[[:space:]]*//')
    result3=$(docker exec -i postgres-3 psql -h localhost -U postgres -d postgres -lqt | cut -f 1 -d\| | grep -e "postgres" | sed -e 's/^[[:space:]]*//')

    if [ "$result1"="postgres" ] && [ "$result2"="postgres" ] && [ "$result3"="postgres" ]; then
        printf "successfully connected to postgresDBs\n"
        break
    fi
    sleep 2
done
sleep 4
docker-compose -f config/auth.yaml up -d
docker ps -a
echo "successfully started authentication servers!"
