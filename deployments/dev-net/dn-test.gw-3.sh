#!/bin/bash

################################
# Run local development network
################################

. ./scripts/setup.sh
export NGX_TEMPLATE=$NGX_TEMPLATE_A_U_G

SECONDS=0

parseArgs $0 "$@"
./cleanup.sh $OPTION

# STEP 1
./bootstrap.sh "$COMPOSE_3" "org0" "org1 org2 org3"

# STEP 2
docker-compose $COMPOSE_3_S up -d
printMessage "docker-compose up $COMPOSE_3_S" $?
containerWait "postgres01" "init process complete"
containerWait "postgres02" "init process complete"
containerWait "postgres03" "init process complete"

# STEP 3
docker-compose $COMPOSE_3_S_A up -d --no-recreate
printMessage "docker-compose up $COMPOSE_3_S_A" $?
containerWait "auth-server1" "Auth server started"
containerWait "auth-server2" "Auth server started"
containerWait "auth-server3" "Auth server started"

# STEP 4
docker-compose $COMPOSE_3_S_A_G up -d --no-recreate
printMessage "docker-compose up $COMPOSE_3_S_A_G" $?
containerWait "gw-org1" "gateway ready at"
containerWait "gw-org2" "gateway ready at"
containerWait "gw-org3" "gateway ready at"

# STEP 5
docker-compose $COMPOSE_3_S_A_G $COMPOSE_3_NGX up -d --no-recreate
printMessage "docker-compose up proxy server" $?
sleep 1

# STEP 6
docker-compose $COMPOSE_3_S_A_G_T $COMPOSE_3_NGX up -d --no-recreate
printMessage "docker-compose up $COMPOSE_3_S_A_G_T" $?

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
