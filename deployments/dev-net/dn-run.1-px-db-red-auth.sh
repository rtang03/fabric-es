#!/bin/bash

################################
# Run local development network
################################

. ./scripts/setup.sh

SECONDS=0

parseArgs $0 "$@"
./cleanup.sh $OPTION

# STEP 1
./bootstrap.sh "$COMPOSE_1_1ORG" "org0" "org1"

# STEP 2
docker-compose $COMPOSE_1_1ORG up -d
printMessage "docker-compose up $COMPOSE_1_1ORG" $?
containerWait "postgres01" "init process complete"

# STEP 3
docker-compose $COMPOSE_2_1ORG up -d --no-recreate
printMessage "docker-compose up $COMPOSE_2_1ORG" $?
containerWait "auth-server1" "Auth server started"

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"