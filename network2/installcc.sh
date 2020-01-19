cd ../packages/chaincode
# yarn install
yarn build

# Install chaincode
docker exec cli.org1.example.com sh -c "/setup/install_chaincode.sh org1.example.com peer0 eventstore 1.0 7051 Org1MSP/admin Org1MSP/peer0.org1.example.com"
docker exec cli.org1.example.com sh -c "/setup/install_chaincode.sh org1.example.com peer0 privatedata 1.0 7051 Org1MSP/admin Org1MSP/peer0.org1.example.com"
docker exec cli.org1.example.com sh -c "/setup/install_chaincode.sh org1.example.com peer1 eventstore 1.0 8051 Org1MSP/admin Org1MSP/peer1.org1.example.com"
docker exec cli.org1.example.com sh -c "/setup/install_chaincode.sh org1.example.com peer1 privatedata 1.0 8051 Org1MSP/admin Org1MSP/peer1.org1.example.com"
docker exec cli.org2.example.com sh -c "/setup/install_chaincode.sh org2.example.com peer0 eventstore 1.0 9051 Org2MSP/admin Org2MSP/peer0.org2.example.com"
docker exec cli.org2.example.com sh -c "/setup/install_chaincode.sh org2.example.com peer0 privatedata 1.0 9051 Org2MSP/admin Org2MSP/peer0.org2.example.com"
docker exec cli.org2.example.com sh -c "/setup/install_chaincode.sh org2.example.com peer1 eventstore 1.0 10051 Org2MSP/admin Org2MSP/peer1.org2.example.com"
docker exec cli.org2.example.com sh -c "/setup/install_chaincode.sh org2.example.com peer1 privatedata 1.0 10051 Org2MSP/admin Org2MSP/peer1.org2.example.com"
docker exec cli.org3.neworg.com sh -c "/setup/install_chaincode.sh org3.neworg.com peer0 eventstore 1.0 11051 Org3MSP/admin Org3MSP/peer0.org3.neworg.com"
docker exec cli.org3.neworg.com sh -c "/setup/install_chaincode.sh org3.neworg.com peer0 privatedata 1.0 11051 Org3MSP/admin Org3MSP/peer0.org3.neworg.com"
docker exec cli.org3.neworg.com sh -c "/setup/install_chaincode.sh org3.neworg.com peer1 eventstore 1.0 12051 Org3MSP/admin Org3MSP/peer1.org3.neworg.com"
docker exec cli.org3.neworg.com sh -c "/setup/install_chaincode.sh org3.neworg.com peer1 privatedata 1.0 12051 Org3MSP/admin Org3MSP/peer1.org3.neworg.com"

# Instantiate chaincode
docker exec cli.org1.example.com sh -c "/setup/instantiate_chaincode_org1.sh"

# Invoke chaincode
docker exec cli.org1.example.com sh -c "/setup/invoke_chaincode_org1.sh"