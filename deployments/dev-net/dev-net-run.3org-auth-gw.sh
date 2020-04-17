#!/bin/bash

################################
# Run local development network
################################

. ./scripts/setup.sh

SECONDS=0

parseArgs $0 "$@"
./cleanup.sh $OPTION

# STEP 1
./bootstrap.sh "$COMPOSE_1_3ORG" "org0" "org1 org2 org3"

# STEP 2
containerWait "postgres01" "psql -h localhost -U postgres -d auth_db -lqt" "auth_db"
containerWait "postgres02" "psql -h localhost -U postgres -d auth_db -lqt" "auth_db"
containerWait "postgres03" "psql -h localhost -U postgres -d auth_db -lqt" "auth_db"

# STEP 3
docker-compose $COMPOSE_2_3ORG up -d
printMessage "docker-compose up $COMPOSE_2_3ORG" $?

# STEP 4
docker-compose $COMPOSE_3_3ORG up -d
printMessage "docker-compose up $COMPOSE_3_3ORG" $?

containerWait "auth-server1" "Auth server started"
containerWait "auth-server2" "Auth server started"
containerWait "auth-server3" "Auth server started"
containerWait "gw-org1" "gateway ready at"
containerWait "gw-org2" "gateway ready at"
containerWait "gw-org3" "gateway ready at"

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
