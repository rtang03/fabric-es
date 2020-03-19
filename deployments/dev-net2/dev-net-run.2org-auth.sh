#!/usr/bin/env bash

################################
# Run local development network
################################

. ./scripts/setup.sh

COMPOSE="-f $COMPOSE_2ORG -f $COMPOSE_2ORG_AUTH"
SECONDS=0

./cleanup.sh

# STEP 1
./bootstrap.sh "$COMPOSE" "org0" "org1" "org2" "2org"

# STEP 2
containerWait "postgres01" "psql -h localhost -U postgres -d auth_db -lqt" "auth_db"
containerWait "postgres02" "psql -h localhost -U postgres -d auth_db -lqt" "auth_db"

# STEP 3
docker-compose $COMPOSE up -d
printMessage "docker-compose up $COMPOSE" $?

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
