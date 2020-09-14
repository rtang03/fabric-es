#!/bin/bash

#######################################
# Build tester docker images
#######################################

if [[ ( $# -eq 1 ) && ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: ./dn-build.tester.sh"
  exit 0
fi

. ./scripts/setup.sh

SECONDS=0

./cleanup.sh

printf "Cleaning up old image $TEST_IMAGE\n"
docker rmi $TEST_IMAGE

echo "Create build context..."
rm -fr $ROOT_DIR/packages/tester/build
mkdir -p $ROOT_DIR/packages/tester/build
cp $ROOT_DIR/package.json $ROOT_DIR/packages/tester/build/

rm -fr $ROOT_DIR/packages/tester/dist
$LIBS_DIR/.bin/tsc -p $ROOT_DIR/packages/tester/tsconfig.json

echo "Packing app files..."
cp $ROOT_DIR/packages/tester/*.json $ROOT_DIR/packages/tester/*.js $ROOT_DIR/packages/tester/build
cp -R $ROOT_DIR/packages/tester/src $ROOT_DIR/packages/tester/build
cp -R $ROOT_DIR/packages/tester/dist $ROOT_DIR/packages/tester/build
cp ${CONF_DIR}tester/.env.test $ROOT_DIR/packages/tester/build/.env
cp $ROOT_DIR/packages/tester/entrypoint.sh $ROOT_DIR/packages/tester/build

printMessage "Create build context for tester" $?
sleep 1

### build image ###
cd $ROOT_DIR/packages/tester
DOCKER_BUILD=1 docker build --no-cache -t $TEST_IMAGE .
printMessage "Create image ${TEST_IMAGE}" $?
sleep 1

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
