#!/bin/bash

################################
# Run local development network
################################

. ./scripts/setup.sh

SECONDS=0

parseArgs $0 "$@"
./cleanup.sh $OPTION

# STEP 1
./bootstrap.sh "$COMPOSE_0_2ORG" "org0" "org1 org2"

# STEP 2
docker-compose $COMPOSE_1_2ORG up -d
printMessage "docker-compose up $COMPOSE_1_2ORG" $?
containerWait "postgres01" "init process complete"
containerWait "postgres02" "init process complete"

# STEP 3
docker-compose $COMPOSE_2_2ORG up -d --no-recreate
printMessage "docker-compose up $COMPOSE_2_2ORG" $?
containerWait "auth-server1" "Auth server started"
containerWait "auth-server2" "Auth server started"

# STEP 4
docker-compose $COMPOSE_3_2ORG up -d --no-recreate
printMessage "docker-compose up $COMPOSE_3_2ORG" $?
containerWait "ui-account1" "Server listening at"
containerWait "ui-account2" "Server listening at"

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
