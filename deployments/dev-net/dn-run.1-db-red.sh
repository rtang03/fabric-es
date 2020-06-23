#!/bin/bash

################################
# Run local development network
################################

. ./scripts/setup.sh

SECONDS=0

parseArgs $0 "$@"
./cleanup.sh $OPTION

# STEP 1
./bootstrap.sh "$COMPOSE_1_S" "org0" "org1"

# STEP 2
docker-compose $COMPOSE_1_S up -d
printMessage "docker-compose up $COMPOSE_1_S" $?
containerWait "postgres01" "init process complete"

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"