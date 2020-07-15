#!/bin/bash

################################
# Run local development network
################################

. ./scripts/setup.sh
export NGX_TEMPLATE=$NGX_TEMPLATE_A_U

SECONDS=0

parseArgs $0 "$@"
./cleanup.sh $OPTION

# STEP 1
docker-compose $COMPOSE_0_S up -d
printMessage "docker-compose up $COMPOSE_0_S" $?
#containerWait "postgres01" "init process complete"

# STEP 2
docker-compose $COMPOSE_0_S_A up -d --no-recreate
printMessage "docker-compose up $COMPOSE_0_S_A" $?
containerWait "auth-server1" "Auth server started"

# STEP 3
docker-compose $COMPOSE_0_S_A_U up -d --no-recreate
printMessage "docker-compose up $COMPOSE_0_S_A_U" $?
containerWait "ui-control1" "Server listening at"

# STEP 4
docker-compose $COMPOSE_0_S_A_U $COMPOSE_1_NGX up -d --no-recreate
printMessage "docker-compose up proxy server" $?

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
