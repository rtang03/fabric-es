#!/usr/bin/env bash

################################
# Run local development network
################################

. ./scripts/setup.sh

COMPOSE="-f $COMPOSE_2ORG -f $COMPOSE_3ORG"
SECONDS=0

./cleanup.sh

./bootstrap.sh "$COMPOSE" "org0" "org1" "org2 org3" "3org"

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
