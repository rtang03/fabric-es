RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

export IMAGE_TAG=1.4.3
export ARTIFACTS=./artifacts
export SCRIPTS=./scripts
export CHAINCODE=../../packages/chaincode
export CONFIG=./config

docker-compose -f compose.1.2org.yaml down

docker rm -f $(docker ps -aq -f status=exited)

sudo rm -rf ./artifacts

# docker rm -f $(docker ps -aq -f name=dev-*)
#docker-compose -p ci -f ./docker-compose.ci.yaml kill
#docker-compose -p ci -f ./docker-compose.ci.yaml rm -f
