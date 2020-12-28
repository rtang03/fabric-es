#!/bin/bash

################################
# Run local development network
################################

. ./scripts/setup.sh

SECONDS=0

parseArgs $0 "$@"
./cleanup.sh $OPTION

# STEP 1
docker-compose $COMPOSE_0_S up -d
printMessage "docker-compose up $COMPOSE_0_S" $?
containerWait "postgres01" "init process complete"

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
