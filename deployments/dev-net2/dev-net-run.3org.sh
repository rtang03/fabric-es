#!/usr/bin/env bash

################################
# Run local development network
################################

# note: this is similar to ./run-unit-test.sh, but the cleanup step is not necessary here.

. ./setup.sh

COMPOSE="-f $COMPOSE_2ORG -f $COMPOSE_3ORG"
SECONDS=0

./cleanup.sh "$COMPOSE"

if [[ ( $# -lt 1 ) || ( $1 != "-d" && $1 != "--down" ) ]]; then
  ./bootstrap.sh "$COMPOSE" org0 org1 "org2 org3" 3org
fi

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
