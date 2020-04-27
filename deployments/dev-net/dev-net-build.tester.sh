#!/bin/bash

#######################################
# Build tester docker images
#######################################

if [[ ( $# -eq 1 ) && ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: ./dev-net-build.tester.sh"
  exit 0
fi

. ./scripts/setup.sh

SECONDS=0

./cleanup.sh

printf "Cleaning up old image $TEST_IMAGE\n"
docker rmi $TEST_IMAGE

### create build context ###
rm -fr $ROOT_DIR/.build
mkdir -p $ROOT_DIR/.build
cp $ROOT_DIR/package.json $ROOT_DIR/.build/

echo "Packing app files..."
mkdir -p $ROOT_DIR/.build/packages/tester
cp $ROOT_DIR/packages/tester/*.json $ROOT_DIR/packages/tester/*.js $ROOT_DIR/.build/packages/tester/
cp ${CONF_DIR}tester/.env.test $ROOT_DIR/.build/packages/tester/.env
cp -R $ROOT_DIR/packages/tester/src $ROOT_DIR/.build/packages/tester/
cp $ROOT_DIR/packages/tester/entrypoint.sh $ROOT_DIR/.build/

printMessage "Create build context for tester" $?
sleep 1

### build image ###
cd $ROOT_DIR
DOCKER_BUILD=1 docker build --no-cache -f ./tester.dockerfile -t $TEST_IMAGE .
printMessage "Create image ${TEST_IMAGE}" $?
sleep 1

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
