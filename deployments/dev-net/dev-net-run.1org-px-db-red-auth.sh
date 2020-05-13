#!/usr/bin/env bash

################################
# Run local development network
################################

. ./scripts/setup.sh

SECONDS=0

parseArgs $0 "$@"
./cleanup.sh $OPTION

# STEP 1
#./bootstrap.sh "$COMPOSE_1_1ORG" "org0" "org1 org2"
docker-compose -f compose.1org.px-db-red.yaml up -d
printMessage "docker-compose up compose.1org.px-db-red.yaml" $?

# STEP 2
containerWait "postgres" "psql -h localhost -U postgres -d auth_db -lqt" "auth_db"

# STEP 3
docker-compose -f compose.1org.px-db-red.yaml -f compose.1org.auth.yaml up -d
printMessage "docker-compose up compose.1org.px-db-red.yaml compose.1org.auth.yaml" $?

containerWait "auth" "Auth server started"

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
