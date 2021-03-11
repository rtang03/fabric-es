#!/bin/bash

#######################################
# Build tester docker images
#######################################

if [[ ( $# -ne 0 ) || ( $# -eq 1 ) && ( $1 = "-h" || $1 = "--help" ) ]]; then
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
cp ${CONF_DIR}tester/.env.dev-net.tester $ROOT_DIR/packages/tester/build/.env
cp ${CONF_DIR}tester/entrypoint.tester.sh $ROOT_DIR/packages/tester/build/entrypoint.sh

printMessage "Create build context for tester" $?
sleep 1

### build image ###
cd $ROOT_DIR/packages/tester
set -x
DOCKER_BUILD=1 docker build --no-cache -f ${CONF_DIR}tester/dockerfile.tester -t $TEST_IMAGE .
res=$?
docker tag $TEST_IMAGE cdi-samples/tester
set +x
printMessage "Create image ${TEST_IMAGE}" $res
sleep 1

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
