#!/bin/bash

#######################################
# Build gw-orgX docker images
# $@ - list of orgs (e.g. "org1 org2")
#######################################

if [[ ( $# -eq 0 ) || ( $1 = "-h" || $1 = "--help" ) ]]; then
  echo "Usage: $0 [org code 1] {[org code 2] {[org code 3]}}"
  exit 0
fi

for ORG in $*
do
  if [[ $ORG -ne "org1" || $ORG -ne "org2" || $ORG -ne "org3" ]]; then
    echo "invalid arg $ORG"
    exit 0
  fi
done


### Init environment variables ###
. ./scripts/setup.sh

SECONDS=0

### Clean images before build ###
./cleanup.sh

for ORG in $*
do
  cd $ROOT_DIR
  ### Package Name ###
  PKG_NAME=`cat $ROOT_DIR/packages/gw-${ORG}/package.json | grep \"name\" | awk '{print $2}' | awk -F'"' '{print $2}' | awk -F'@' '{print $2}'`
  ### Image ID ###
  IMG_ID=`docker images | grep "${PKG_NAME}" | grep "${RELEASE}" | awk '{print $3}'`

  ### clean image ###
  if [[ ! -z $IMG_ID ]]; then
    printf "Cleaning up old image ${PKG_NAME}:${RELEASE} with ID:$IMG_ID \n"
    docker rmi -f $IMG_ID
  fi

  ### compile and build the packages ###
  printf "Creating build context of $ORG ...\n"
  cd $CURRENT_DIR
  ./build-gw.sh $ORG
  printMessage "Create build context for $ORG" $?
  sleep 1

  ### build image ###
  cd $ROOT_DIR
  set -x
  DOCKER_BUILD=1 docker build --no-cache -f ${CONF_DIR}gw-${ORG}/dockerfile.gw-${ORG} -t ${PKG_NAME}:${RELEASE} .
  res=$?
  docker tag ${PKG_NAME}:${RELEASE} ${PKG_NAME}
  set +x
  printMessage "Create image ${PKG_NAME}:${RELEASE}" $res
  sleep 1
done

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
