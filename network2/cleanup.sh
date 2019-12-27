#!/bin/sh

# Import common.sh
cd scripts
. common.sh

# export .env variables
export $(grep -v '^#' ${_FABRIC_DIR}/.env | xargs)

# Cleaup the environment
docker rm -f logspout
docker-compose -f ${_YAML_FILE} down --volumes
docker volume prune -f
docker network prune -f
docker system prune -f
sudo rm -rf ${_HYPERLEDGER_DIR}

# Cleanup genesis block
sudo rm ${_FABRIC_DIR}/genesis.block

# Cleanup chaincode images
docker rmi -f $(docker images | grep fabcar | awk '{print $3}')
docker rmi -f $(docker images | grep eventstore | awk '{print $3}')
docker rmi -f $(docker images | grep privatedata | awk '{print $3}')

# Cleanup chaincode builds
sudo rm -rf ${_CHAINCODE_DIR}/dist
# sudo rm -rf ${_CHAINCODE_DIR}/node_modules

sleep 5
