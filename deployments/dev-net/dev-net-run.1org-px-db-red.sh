#!/usr/bin/env bash

################################
# Run local development network for Auth Server ONLY
# This does NOT bootstrap Fabric network
################################

. ./scripts/setup.sh

SECONDS=0

parseArgs $0 "$@"
./cleanup.sh $OPTION

# STEP 1
docker-compose -f compose.1org.px-db-red.yaml up -d

# STEP 2
containerWait "postgres" "psql -h localhost -U postgres -d auth_db -lqt" "auth_db"

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
