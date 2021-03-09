#!/bin/bash

################################################################
# Run local development network with blockchain netowrk supplied custom image
################################################################
if [[ ( $# -le 0 ) || ( $# -gt 3 ) || ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: $0 [org no] {gw-org} {test}"
  echo "[org no] : number of org to startup"
  echo "{gw-org} : option to startup include gw-org"
  echo "{test}   : option to startup include tester"
  exit 0
fi

if ! [[ -z $1 || "$1" =~ ^[0-9]+$ ]]; then
  echo "invalid arg [org no] : $1!!! only accept integer"
  exit 0
fi
if [[ "$1" -lt 1 ]] || [[ "$1" -gt 9 ]]; then
  echo "invalid arg [org no] must within 1 to 9 "
  exit 0
fi
if [[ ! -z $2 && $2 != "auth" && $2 != "gw-org" ]]; then
  echo "invalid arg : $2 !!! only accept \"auth\" or \"gw-org\""
  exit 0
fi
if [[ ! -z $3 && $3 != "test" ]]; then
  echo "invalid arg {test} : $3!!! only accept \"test\""
  exit 0
fi

. ./scripts/setup.sh

ORG_COUNT=$1

./cleanup.sh

NGX_ARG="auth"
if [[ ! -z $2 && $2 == "gw-org" ]]; then
  NGX_ARG="auth gw-org"
fi

# STEP 0 Gen blockchain config oand docker-compose file
./build-config.sh $ORG_COUNT "$NGX_ARG"


# STEP 1
GEN_COMPOSE=$COMPOSE_ORG
./bootstrap.sh "$GEN_COMPOSE" "org0" "$ORG_COUNT"


# STEP 2
GEN_COMPOSE="$GEN_COMPOSE $COMPOSE_CC $COMPOSE_DBRD"
docker-compose $GEN_COMPOSE up -d --no-recreate
printMessage "docker-compose up $GEN_COMPOSE" $?
containersWait $ORG_COUNT "postgres" "init process complete"
containersWait $ORG_COUNT "redis" "init process complete"

# STEP 3
GEN_COMPOSE="$GEN_COMPOSE $COMPOSE_AUTH"
docker-compose $GEN_COMPOSE up -d --no-recreate
printMessage "docker-compose up $GEN_COMPOSE" $?
containersWait $ORG_COUNT "auth-server" "Auth server started"


# STEP 4
if [[ ! -z $2 && $2 =~ "gw-org" ]]; then
  COMPOSE_GATEWAY=
  for ((i=1;i<=$ORG_COUNT;i++));
  do
    COMPOSE_GATEWAY="$COMPOSE_GATEWAY -f compose.${i}org.gw.yaml"
  done

  GEN_COMPOSE="$GEN_COMPOSE $COMPOSE_GATEWAY"
  docker-compose $GEN_COMPOSE up -d --no-recreate
  printMessage "docker-compose up $GEN_COMPOSE" $?
  containersWait $ORG_COUNT "gw-org" "gateway ready at"
fi

# STEP 5
GEN_COMPOSE="$GEN_COMPOSE $COMPOSE_NGX"
docker-compose $GEN_COMPOSE up -d --no-recreate
printMessage "docker-compose up $GEN_COMPOSE" $?


# STEP 6
if [[ ! -z $3 && $3 -eq "test" ]]; then
  GEN_COMPOSE="$GEN_COMPOSE $COMPOSE_TST"
  docker-compose $GEN_COMPOSE up -d --no-recreate
  printMessage "docker-compose up $GEN_COMPOSE" $?

  echo "Starting automated tests..."
  TEST_EXIT_CODE=`docker wait tester`;

  docker logs tester

  if [ -z ${TEST_EXIT_CODE+x} ] || [ "$TEST_EXIT_CODE" -ne 0 ] ; then
    printf "${RED}Tests Failed${NC} - Exit Code: $TEST_EXIT_CODE\n"
    for ((i=1;i<=$ORG_COUNT;i++));
    do
      printf "\n${RED} [DEBUG] docker logs gw-org${i}${NC}\n"
      docker logs gw-org${i}
    done
    exit 1
  else
    printf "${GREEN}Tests Passed${NC}\n"
  fi

  # check /healthcheck
  set -x
  if [ $NEEDSUDO -eq 1 ]; then
    wget http://localhost:4001/healthcheck
  else
    curl localhost:4001/healthcheck
  fi
  set +x

  # if test fails, it won't run cleanup
  ./cleanup.sh

fi

