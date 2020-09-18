#!/bin/bash

################################
# Run local development network
################################

. ./scripts/setup.sh
export TARGET_URL=https://tester:4321

SECONDS=0

parseArgs $0 "$@"
if [[ "$COMPOSE" == "0" ]]; then
  ./cleanup.sh $OPTION

  ./bootstrap.sh "$COMPOSE_3_S" "org0" "org1 org2 org3"
fi

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
docker-compose $COMPOSE_3_S_A_R up -d --no-recreate
printMessage "docker-compose up $COMPOSE_3_S_A_R" $?
containerWait "rl-org1" "relay ready"
containerWait "rl-org2" "relay ready"
containerWait "rl-org3" "query available"

# STEP 5
docker-compose $COMPOSE_3_S_A_R_T up -d --no-recreate
printMessage "docker-compose up $COMPOSE_3_S_A_R_T" $?

./dn-test.cleanup.sh tester $SECONDS &
echo "Starting automated tests..."
