#!/usr/bin/env bash

################################
# Run unit-test in local machine
################################

. ./setup.sh

SECONDS=0

./cleanup.sh

./bootstrap.3org.sh

cd $ROOT_DIR && yarn unit-test:fab

cd $CURRENT_DIR

./shutdown-cleanup.sh

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.${NC}"
