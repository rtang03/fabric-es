#!/bin/bash

################################
# Run local development network
################################

. ./scripts/setup.sh
export NGX_TEMPLATE=$NGX_TEMPLATE_A

SECONDS=0

parseArgs $0 "$@"
./cleanup.sh $OPTION

# STEP 1
./bootstrap.sh "$COMPOSE_1" "org0" "org1"
printMessage "bootstrap script" $?

# STEP 2
docker-compose $COMPOSE_1_S up -d --no-recreate
printMessage "docker-compose up $COMPOSE_1_S" $?
containerWait "postgres01" "init process complete"

# STEP 3
docker-compose $COMPOSE_1_S_A up -d --no-recreate
printMessage "docker-compose up $COMPOSE_1_S_A" $?
containerWait "auth-server1" "Auth server started"

# STEP 4
docker-compose $COMPOSE_1_S_A $COMPOSE_1_NGX up -d --no-recreate
printMessage "docker-compose up proxy server" $?

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
