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
./bootstrap.sh "$COMPOSE_3_S" "org0" "org1 org2 org3"

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
docker-compose $COMPOSE_3_S_A_U up -d --no-recreate
printMessage "docker-compose up $COMPOSE_3_S_A_U" $?
containerWait "ui-account1" "Server listening at"
containerWait "ui-account2" "Server listening at"
containerWait "ui-account3" "Server listening at"

# STEP 5
docker-compose $COMPOSE_3_S_A_U_G up -d --no-recreate
printMessage "docker-compose up $COMPOSE_3_S_A_U_G" $?
containerWait "gw-org1" "gateway ready at"
containerWait "gw-org2" "gateway ready at"
containerWait "gw-org3" "gateway ready at"

# STEP 6
docker-compose $COMPOSE_3_S_A_U_G $COMPOSE_3_NGX up -d --no-recreate
printMessage "docker-compose up proxy server" $?

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
