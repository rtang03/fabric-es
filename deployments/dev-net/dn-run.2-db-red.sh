#!/bin/bash

################################
# Run local development network
################################

. ./scripts/setup.sh

SECONDS=0

parseArgs $0 "$@"
./cleanup.sh $OPTION

# STEP 1
./bootstrap.sh "$COMPOSE_2_S" "org0" "org1 org2"

# STEP 2
docker-compose $COMPOSE_2_S up -d
printMessage "docker-compose up $COMPOSE_2_S" $?
containerWait "postgres01" "init process complete"
containerWait "postgres02" "init process complete"

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"