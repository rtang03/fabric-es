#!/bin/bash

################################
# Run local development network
################################

. ./scripts/setup.sh

SECONDS=0

parseArgs $0 "$@"
./cleanup.sh $OPTION

# STEP 1
docker-compose $COMPOSE_0_0ORG up -d
printMessage "docker-compose up $COMPOSE_0_0ORG" $?
containerWait "postgres01" "init process complete"

# STEP 2
docker-compose $COMPOSE_1_0ORG up -d --no-recreate
printMessage "docker-compose up $COMPOSE_1_0ORG" $?
containerWait "auth-server1" "Auth server started"

export NGX_TEMPLATE=$NG_AU_TEMPLATE

docker-compose $COMPOSE_1_0ORG -f compose.1org.ngx.yaml up -d --no-recreate
printMessage "docker-compose up proxy server" $?

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
