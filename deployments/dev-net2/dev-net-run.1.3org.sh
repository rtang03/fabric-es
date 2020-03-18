#!/usr/bin/env bash

################################
# Run local development network
################################

# note: this is similar to ./run-unit-test.sh, but the cleanup step is not necessary here.

. ./setup.sh

SECONDS=0

./cleanup.sh

./bootstrap.3org.sh

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
