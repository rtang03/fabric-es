#!/bin/bash

################################
# Run local development network
################################

. ./scripts/setup.sh

SECONDS=0

parseArgs $0 "$@"
./cleanup.sh $OPTION

# STEP 1
./bootstrap.sh "$COMPOSE_1" "org0" "org1"
printMessage "bootstrap script" $?

# STEP 2
docker-compose $COMPOSE_1_S up -d --no-recreate
printMessage "docker-compose up $COMPOSE_1_S" $?
containerWait "postgres01" "init process complete"

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
