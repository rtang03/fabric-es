#!/usr/bin/env bash

################################
# Run local development network
################################

SECONDS=0
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

./cleanup.sh

./bootstrap.2org.sh

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
