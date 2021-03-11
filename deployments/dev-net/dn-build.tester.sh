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

### Package Name ###
PKG_NAME=`cat $ROOT_DIR/packages/tester/package.json | grep \"name\" | awk '{print $2}' | awk -F'"' '{print $2}' | awk -F'@' '{print $2}'`
### Image ID ###
IMG_ID=`docker images | grep "${PKG_NAME}" | grep "${RELEASE}" | awk '{print $3}'`

### clean image ###
if [[ ! -z $IMG_ID ]]; then
  printf "Cleaning up old image ${PKG_NAME}:${RELEASE} with ID:$IMG_ID \n"
  docker rmi -f $IMG_ID
fi

### compile and build the packages ###
echo "Create build context of tester ..."
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
DOCKER_BUILD=1 docker build --no-cache -f ${CONF_DIR}tester/dockerfile.tester -t ${PKG_NAME}:${RELEASE} .
res=$?
docker tag ${PKG_NAME}:${RELEASE} ${PKG_NAME}
set +x
printMessage "Create image ${PKG_NAME}:${RELEASE}" $res
sleep 1

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
