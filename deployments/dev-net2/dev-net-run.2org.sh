#!/usr/bin/env bash

################################
# Run local development network
################################

. ./scripts/setup.sh

SECONDS=0

./cleanup.sh

./bootstrap.sh "$COMPOSE_0_2ORG" "org0" "org1" "org2" "2org"

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
