#!/usr/bin/env bash
docker-compose -p ci -f ./docker-compose.ci.yaml up -d

if [ $? -ne 0 ] ; then
  printf "${RED}Docker Compose Failed${NC}\n"
  exit -1
fi

exit 0
