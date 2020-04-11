#!/usr/bin/env bash

################################
# Run local development network
################################

. ./scripts/setup.sh

SECONDS=0

OPTION=-d
if [ $# -eq 1 ]; then
  OPTION=$1
fi
./cleanup.sh $OPTION

# STEP 1
./bootstrap.sh "$COMPOSE_0_2ORG" "org0" "org1 org2"

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
