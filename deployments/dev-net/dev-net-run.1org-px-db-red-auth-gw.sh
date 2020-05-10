#!/usr/bin/env bash

################################
# Run local development network
################################

. ./scripts/setup.sh

SECONDS=0

parseArgs $0 "$@"
./cleanup.sh $OPTION

# STEP 1
./bootstrap.sh "$COMPOSE_1_1ORG" "org0" "org1 org2"

# STEP 2
containerWait "postgres" "psql -h localhost -U postgres -d auth_db -lqt" "auth_db"

# STEP 3
docker-compose $COMPOSE_2_1ORG up -d
printMessage "docker-compose up $COMPOSE_2_1ORG" $?

# STEP 4
docker-compose $COMPOSE_3_1ORG up -d
printMessage "docker-compose up $COMPOSE_3_1ORG" $?

containerWait "auth" "Auth server started"
containerWait "gw-org1" "gateway ready at"

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
