#!/usr/bin/env bash

################################
# Run local development network
################################

. ./scripts/setup.sh

SECONDS=0

./cleanup.sh

if [[ ( $# -ge 0 ) && ( $1 = "-d" || $1 = "--down" ) ]]; then
  exit $?
fi

# STEP 1
./bootstrap.sh "$COMPOSE_1_3ORG" "org0" "org1" "org2 org3" "3org"

# STEP 2
containerWait "postgres01" "psql -h localhost -U postgres -d auth_db -lqt" "auth_db"
containerWait "postgres02" "psql -h localhost -U postgres -d auth_db -lqt" "auth_db"
containerWait "postgres03" "psql -h localhost -U postgres -d auth_db -lqt" "auth_db"

# STEP 3
docker-compose $COMPOSE_2_3ORG up -d
printMessage "docker-compose up $COMPOSE_2_3ORG" $?
sleep 5

# STEP 4
docker-compose $COMPOSE_3_3ORG up -d
printMessage "docker-compose up $COMPOSE_3_3ORG" $?

# STEP 5
docker-compose $COMPOSE_4_3ORG up -d
printMessage "docker-compose up $COMPOSE_4_3ORG" $?

TEST_EXIT_CODE=`docker wait tester`;
docker logs tester

if [ -z ${TEST_EXIT_CODE+x} ] || [ "$TEST_EXIT_CODE" -ne 0 ] ; then
  printf "${RED}Tests Failed${NC} - Exit Code: $TEST_EXIT_CODE\n"
else
  printf "${GREEN}Tests Passed${NC}\n"
fi

./cleanup.sh

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
