#!/usr/bin/env bash

################################
# Run local development network
################################

. ./scripts/setup.sh

SECONDS=0

./cleanup.sh

# STEP 1
./bootstrap.sh "$COMPOSE_1_2ORG" "org0" "org1" "org2" "2org"

# STEP 2
containerWait "postgres01" "psql -h localhost -U postgres -d auth_db -lqt" "auth_db"
containerWait "postgres02" "psql -h localhost -U postgres -d auth_db -lqt" "auth_db"

# STEP 3
docker-compose $COMPOSE_2_2ORG up -d
printMessage "docker-compose up $COMPOSE_2_2ORG" $?
sleep 5

# STEP 4
docker-compose $COMPOSE_3_2ORG up -d
printMessage "docker-compose up $COMPOSE_3_2ORG" $?

# STEP 5
#docker-compose $COMPOSE_4_2ORG up -d
#printMessage "docker-compose up $COMPOSE_4_2ORG" $?

#TEST_EXIT_CODE=`docker wait tester`;
#docker logs tester
echo "No 2 org integration test available at the moment"

if [ -z ${TEST_EXIT_CODE+x} ] || [ "$TEST_EXIT_CODE" -ne 0 ] ; then
  printf "${RED}Tests Failed${NC} - Exit Code: $TEST_EXIT_CODE\n"
else
  printf "${GREEN}Tests Passed${NC}\n"
fi

./cleanup.sh

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
