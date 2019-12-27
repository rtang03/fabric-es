cd ../packages/chaincode
yarn install
yarn build

# Install chaincode
docker exec cli.org1.example.com sh -c "/setup/install_chaincode.sh org1.example.com peer0 eventstore 1.0 7051"
docker exec cli.org1.example.com sh -c "/setup/install_chaincode.sh org1.example.com peer0 privatedata 1.0 7051"
docker exec cli.org1.example.com sh -c "/setup/install_chaincode.sh org1.example.com peer1 eventstore 1.0 7051"
docker exec cli.org1.example.com sh -c "/setup/install_chaincode.sh org1.example.com peer1 privatedata 1.0 7051"
docker exec cli.org2.example.com sh -c "/setup/install_chaincode.sh org2.example.com peer0 eventstore 1.0 7051"
docker exec cli.org2.example.com sh -c "/setup/install_chaincode.sh org2.example.com peer0 privatedata 1.0 7051"
docker exec cli.org2.example.com sh -c "/setup/install_chaincode.sh org2.example.com peer1 eventstore 1.0 7051"
docker exec cli.org2.example.com sh -c "/setup/install_chaincode.sh org2.example.com peer1 privatedata 1.0 7051"

# Instantiate chaincode
docker exec cli.org1.example.com sh -c "/setup/instantiate_chaincode_org1.sh"

# Invoke chaincode
docker exec cli.org1.example.com sh -c "/setup/invoke_chaincode_org1.sh"