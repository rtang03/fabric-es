export IMAGE_TAG=1.4.3
export ARTIFACTS=./artifacts
export SCRIPTS=./scripts
export CHAINCODE=../../packages/chaincode
export CONFIG=./config

docker-compose -f compose.2org.yaml down

docker rm -f $(docker ps -aq -f status=exited)
# docker rm -f $(docker ps -aq -f name=dev-*)
#docker-compose -p ci -f ./docker-compose.ci.yaml kill
#docker-compose -p ci -f ./docker-compose.ci.yaml rm -f
