#!/bin/bash

################################
# Run local development network
################################

. ./scripts/setup.sh
export TARGET_URL=http://tester:4321

SECONDS=0

parseArgs $0 "$@"
if [[ "$COMPOSE" == "0" ]]; then
  ./cleanup.sh $OPTION

  # STEP 1
  ./bootstrap.sh "$COMPOSE_3" "org0" "org1 org2 org3"
fi

if [[ "$TESTONLY" == "0" ]]; then
  # STEP 2
  docker-compose $COMPOSE_3_S up -d --no-recreate
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
  docker-compose $COMPOSE_3_S_A_R up -d --no-recreate
  printMessage "docker-compose up $COMPOSE_3_S_A_R" $?
  containerWait "rl-org1" "relay ready"
  containerWait "rl-org2" "relay ready"
  containerWait "rl-org3" "query available"
fi

# STEP 5
docker-compose $COMPOSE_3_S_A_R_T up -d --no-recreate
printMessage "docker-compose up $COMPOSE_3_S_A_R_T" $?

if [[ "$CLEANUP" == "1" ]]; then
  ./dn-test.cleanup.sh tester $SECONDS &
  echo "Starting automated tests..."
else
  echo "Starting automated tests..."
  duration=$SECONDS
  printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
fi
