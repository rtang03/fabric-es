#!/bin/bash

#################################
# Build Auth-Server docker image
#################################

if [[ ( $# -eq 1 ) && ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: ./dev-net-build.auth.sh"
  exit 0
fi

. ./scripts/setup.sh

SECONDS=0

./cleanup.sh

printf "Cleaning up old image $AUTH_IMAGE\n"
docker rmi $AUTH_IMAGE

### create build context ###
rm -fr $ROOT_DIR/.build
mkdir -p $ROOT_DIR/.build
cp $ROOT_DIR/package.json $ROOT_DIR/.build/

echo "Building authentication package..."
rm -fr $ROOT_DIR/packages/authentication/dist
$LIBS_DIR/.bin/tsc -p $ROOT_DIR/packages/authentication/tsconfig.prod.json

echo "Packing app files..."
mkdir -p $ROOT_DIR/.build/packages/authentication
cp $ROOT_DIR/packages/authentication/package.json $ROOT_DIR/packages/authentication/processes.yaml $ROOT_DIR/.build/packages/authentication/
cp ${CONF_DIR}auth/.env.prod $ROOT_DIR/.build/packages/authentication/.env
cp -R $ROOT_DIR/packages/authentication/dist $ROOT_DIR/.build/packages/authentication/
cp -R $ROOT_DIR/packages/authentication/views $ROOT_DIR/.build/packages/authentication/
cp -R $ROOT_DIR/packages/authentication/public $ROOT_DIR/.build/packages/authentication/

printMessage "Create build context for auth-server"  $?
sleep 1

### build image ###
cd $ROOT_DIR
DOCKER_BUILD=1 docker build --no-cache -f ./auth-server.dockerfile -t $AUTH_IMAGE .
printMessage "Create auth-server image" $?
sleep 1

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
