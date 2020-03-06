#!/usr/bin/env bash
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

printf "${GREEN}Remove docker container: postgres-dev${NC}: "
docker rm postgres-dev -f
