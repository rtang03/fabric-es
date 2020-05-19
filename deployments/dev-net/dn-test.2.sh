#!/bin/bash

################################
# Run local development network
################################

. ./scripts/setup.sh

SECONDS=0

parseArgs $0 "$@"
./cleanup.sh $OPTION

# STEP 1
./bootstrap.sh "$COMPOSE_1_2ORG" "org0" "org1 org2"

# STEP 2
docker-compose $COMPOSE_1_2ORG up -d
printMessage "docker-compose up $COMPOSE_1_2ORG" $?
containerWait "postgres01" "init process complete"
containerWait "postgres02" "init process complete"

# STEP 3
docker-compose $COMPOSE_2_2ORG up -d --no-recreate
printMessage "docker-compose up $COMPOSE_2_2ORG" $?
containerWait "auth-server1" "Auth server started"
containerWait "auth-server2" "Auth server started"

# STEP 4
docker-compose $COMPOSE_5_2ORG up -d --no-recreate
printMessage "docker-compose up $COMPOSE_5_2ORG" $?

echo "Starting automated tests..."
TEST_EXIT_CODE=`docker wait tester`;

docker logs tester

./cleanup.sh

if [ -z ${TEST_EXIT_CODE+x} ] || [ "$TEST_EXIT_CODE" -ne 0 ] ; then
  printf "${RED}Tests Failed${NC} - Exit Code: $TEST_EXIT_CODE\n"
  printf "\n${RED} [DEBUG] docker logs gw-org1${NC}\n"
  docker logs gw-org1
  exit 1
else
  printf "${GREEN}Tests Passed${NC}\n"
fi

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
