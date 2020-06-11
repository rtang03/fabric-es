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
docker-compose $COMPOSE_1_3ORG up -d
printMessage "docker-compose up $COMPOSE_1_3ORG" $?
containerWait "postgres01" "init process complete"
containerWait "postgres02" "init process complete"
containerWait "postgres03" "init process complete"

# STEP 3
docker-compose $COMPOSE_2_3ORG up -d --no-recreate
printMessage "docker-compose up $COMPOSE_2_3ORG" $?
containerWait "auth-server1" "Auth server started"
containerWait "auth-server2" "Auth server started"
containerWait "auth-server3" "Auth server started"

# STEP 4
docker-compose $COMPOSE_3_3ORG up -d --no-recreate
printMessage "docker-compose up $COMPOSE_3_3ORG" $?
containerWait "ui-account1" "Server listening at"
containerWait "ui-account2" "Server listening at"
containerWait "ui-account3" "Server listening at"

# STEP 5
docker-compose $COMPOSE_4_3ORG up -d --no-recreate
printMessage "docker-compose up $COMPOSE_4_3ORG" $?
containerWait "gw-org1" "gateway ready at"
containerWait "gw-org2" "gateway ready at"
containerWait "gw-org3" "gateway ready at"

export NGX_TEMPLATE=$NG_AU_GW_UI_TEMPLATE

docker-compose $COMPOSE_4_3ORG -f compose.3org.ngx.yaml -f compose.2org.ngx.yaml -f compose.1org.ngx.yaml up -d --no-recreate
printMessage "docker-compose up proxy server" $?

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
