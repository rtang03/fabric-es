cd ../packages/chaincode
yarn install
yarn build

# Install chaincode
docker exec cli-org1 bash -c "/setup/install_chaincode.sh org1 peer1 eventstore 1.0 7051"
docker exec cli-org1 bash -c "/setup/install_chaincode.sh org1 peer1 privatedata 1.0 7051"
docker exec cli-org1 bash -c "/setup/install_chaincode.sh org1 peer2 eventstore 1.0 7051"
docker exec cli-org1 bash -c "/setup/install_chaincode.sh org1 peer2 privatedata 1.0 7051"
docker exec cli-org2 bash -c "/setup/install_chaincode.sh org2 peer1 eventstore 1.0 7051"
docker exec cli-org2 bash -c "/setup/install_chaincode.sh org2 peer1 privatedata 1.0 7051"
docker exec cli-org2 bash -c "/setup/install_chaincode.sh org2 peer2 eventstore 1.0 7051"
docker exec cli-org2 bash -c "/setup/install_chaincode.sh org2 peer2 privatedata 1.0 7051"

# Instantiate chaincode
docker exec cli-org1 bash -c "/setup/instantiate_chaincode_org1.sh"
