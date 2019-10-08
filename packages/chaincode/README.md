### Chaincodes

`eventstore` is the chaincode on channel `mychannel`, accessible by all peer node.

`privatedata` is the chaincode, using Hyperledger Farbic private feature. As an example implementation,  
it has two collection `Org1PrivateDetails` and `Org1PrivateDetails`, defined in `collection.json` of
`@espresso/chaincode` package.

### In a new terminal, start the network

```shell script
cd fabric-samples/first-network
./byfn.sh up -l node -f docker-compose-e2e.yaml
```

### Start Logger

```shell script
cd open-platform/packages/configuration/cli
./monitordocker.sh net_byfn
```

### Build chaincode

```shell script
cd open-platform
yarn install
cd open-platform/packages/chaincode
yarn run build
```

### Starting CLIs

```shell script
cd open-platform/packages/configuration/cli
docker-compose -f docker-compose-cli-org1.yaml up -d cliOrg1
docker-compose -f docker-compose-cli-org2.yaml up -d cliOrg2
docker-compose -f docker-compose-cli-org3.yaml up -d cliOrg3
docker-compose -f docker-compose-cli-org4.yaml up -d cliOrg4
```

### Install eventstore chaincode

```shell script
cd open-platform/packages/configuration/cli
docker exec cliOrg1 peer chaincode install -n eventstore -p /opt/gopath/src/github.com/contract -l node -v 0
docker exec cliOrg2 peer chaincode install -n eventstore -p /opt/gopath/src/github.com/contract -l node -v 0
docker exec cliOrg3 peer chaincode install -n eventstore -p /opt/gopath/src/github.com/contract -l node -v 0
docker exec cliOrg4 peer chaincode install -n eventstore -p /opt/gopath/src/github.com/contract -l node -v 0
```

### Instantiate chaincode for eventstore

```shell script
docker exec cliOrg1 peer chaincode instantiate -o orderer.example.com:7050 --tls \
--cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
-n eventstore -l node -c '{"Args":["eventstore:instantiate"]}' -C mychannel -P "OR ('Org1MSP.member', 'Org2MSP.member')" -v 0
```

### Upgrade chaincode for eventstore

After newer version eventstore is later installed, you may use `peer chaincode upgrade` command.

```shell script
docker exec cliOrg1 peer chaincode upgrade -o orderer.example.com:7050 --tls \
--cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
-n eventstore -l node -c '{"Args":["eventstore:instantiate"]}' -C mychannel -P "OR ('Org1MSP.member', 'Org2MSP.member')" -v 1
```

### Invoke chaincode for eventstore

```shell script
docker exec \
-e CORE_PEER_LOCALMSPID=Org1MSP \
-e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp \
cliOrg1 peer chaincode invoke \
-o orderer.example.com:7050 \
-C mychannel -n eventstore --waitForEvent --tls \
--cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
--peerAddresses peer0.org1.example.com:7051 \
--tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
-c '{"Args":["createCommit", "dev_entity", "ent_dev_1001", "0","[{\"type\":\"mon\"}]"]}'
```

### Install privatedata chaincode

```shell script
cd open-platform/packages/configuration/cli
docker exec cliOrg1 peer chaincode install -n privatedata -p /opt/gopath/src/github.com/contract -l node -v 0
docker exec cliOrg2 peer chaincode install -n privatedata -p /opt/gopath/src/github.com/contract -l node -v 0
docker exec cliOrg3 peer chaincode install -n privatedata -p /opt/gopath/src/github.com/contract -l node -v 0
docker exec cliOrg4 peer chaincode install -n privatedata -p /opt/gopath/src/github.com/contract -l node -v 0
```

### Instantiate chaincode for privatedata

```shell script
docker exec cliOrg1 peer chaincode instantiate -o orderer.example.com:7050 --tls \
--cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
-n privatedata -l node -c '{"Args":["privatedata:instantiate"]}' -C mychannel -P "OR ('Org1MSP.member', 'Org2MSP.member')" \
--collections-config /opt/gopath/src/github.com/contract/collections.json -v 0
```

### Upgrade chaincode for privatedata

After newer version privatedata is later installed, you may use `peer chaincode upgrade` command.

```shell script
docker exec cliOrg1 peer chaincode upgrade -o orderer.example.com:7050 --tls \
--cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
-n privatedata -l node -c '{"Args":["privatedata:instantiate"]}' -C mychannel -P "OR ('Org1MSP.member', 'Org2MSP.member')" \
--collections-config /opt/gopath/src/github.com/contract/collections.json -v 1
```

### Invoke chaincode for privatedata

```shell script
export COMMIT=$(echo -n "{\"id\":\"private_1001\",\"entityName\":\"private_entityName\",\"version\":\"0\",\"eventString\":\"[]\"}" | base64 | tr -d \\n)
docker exec \
-e CORE_PEER_LOCALMSPID=Org1MSP \
-e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 \
-e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
-e PEER0_ORG1_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
-e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp \
cliOrg1 peer chaincode invoke -o orderer.example.com:7050 --waitForEvent --tls -C mychannel \
--cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
-n privatedata  -c '{"Args":["privatedata:createCommit","Org1PrivateDetails"]}' --transient "{\"commit\":\"$COMMIT\"}"
```

### Query chaincode for privatedata

```shell script
docker exec \
-e CORE_PEER_LOCALMSPID=Org1MSP \
-e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 \
-e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
-e PEER0_ORG1_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
-e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp \
cliOrg1 peer chaincode query -C mychannel \
-n privatedata  -c '{"Args":["privatedata:queryByEntityIdCommitId","Org1PrivateDetails","private_entityName","private_1001","20190820100646652"]}'
```

### Query chaincode for privatedata

```shell script
docker exec \
-e CORE_PEER_LOCALMSPID=Org1MSP \
-e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 \
-e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
-e PEER0_ORG1_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
-e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp \
cliOrg1 peer chaincode query -C mychannel \
-n privatedata  -c '{"Args":["privatedata:queryByEntityName","Org1PrivateDetails","private_entityName"]}'
```

### Query chaincode for privatedata

```shell script
docker exec \
-e CORE_PEER_LOCALMSPID=Org1MSP \
-e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 \
-e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
-e PEER0_ORG1_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
-e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp \
cliOrg1 peer chaincode query -C mychannel \
-n privatedata  -c '{"Args":["privatedata:queryByEntityId","Org1PrivateDetails","private_entityName","private_1001"]}'
```

### Query chaincode for privatedata from unauthorized peer

```shell script
  docker exec \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_ADDRESS=peer0.org2.example.com:9051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp \
  cliOrg2 peer chaincode query -C mychannel -n privatedata \
  -c '{"Args":["privatedata:queryByEntityId","Org2PrivateDetails","private_entityName","id_00001"]}'
```

### Clean-up

```shell script
cd fabric-samples/first-network
docker rm logspout -f
docker rm $(docker ps -qf "name=cliOrg") -f
docker rm $(docker ps -aqf "name=dev") -f
docker-compose -f docker-compose-e2e.yaml down --volumes
// docker rm $(docker ps -aq)
docker volume prune -f
docker rmi $(docker images -q "dev-*")
rm channel-artifacts/genesis.block channel-artifacts/channel.tx
```

### Clean up command #2 for NGAC development
assume no need to setup CA servers  

Exit monitordock.sh

```shell script
// cd network
docker-compose down
docker rm logspout -f
docker rm $(docker ps -aqf "name=dev") -f
docker rmi $(docker images -q "dev-*")
docker-compose up -d 
./monitordocker.sh
```

Build chaincode  

Under admin-tools yarn run "prepare eventstore"  

... continue NGAC development


    console.log('===Calling beforeTransaction===');
    console.log(ctx.clientIdentity.getID());
    console.log(ctx.clientIdentity.getMSPID());
    console.log(ctx.clientIdentity.getX509Certificate().subject);
    console.log(ctx.clientIdentity.getX509Certificate().issuer);

x509::/C=US/ST=North Carolina/O=Hyperledger/OU=client/CN=Admin@org1.example.com::/C=US/ST=North Carolina/O=Hyperledger/OU=Fabric/CN=rca-org1
Org1MSP
commonName: 'Admin@org1.example.com' }
commonName: 'rca-org1' }

dev-peer0.org1.example.com-eventstore-2|--👆result 👀-
dev-peer0.org1.example.com-eventstore-2|{ fcn: 'instantiate', params: [] }
dev-peer0.org1.example.com-eventstore-2|--args-
dev-peer0.org1.example.com-eventstore-2|[ 'instantiate' ]
dev-peer0.org1.example.com-eventstore-2|--strArgs-
dev-peer0.org1.example.com-eventstore-2|[ 'instantiate' ]
dev-peer0.org1.example.com-eventstore-2|--creator-
dev-peer0.org1.example.com-eventstore-2|{ mspid: 'Org1MSP',
dev-peer0.org1.example.com-eventstore-2|  id_bytes:
dev-peer0.org1.example.com-eventstore-2|   ByteBuffer {
dev-peer0.org1.example.com-eventstore-2|     buffer: <Buffer 0a c1 09 0a 69 08 03 10 01 1a 0b 08 b5 f9 dc ec 05 10 c0 d8 88 32 22 0a 65 76 65 6e 74 73 74 6f 72 65 2a 40 30 34 62 38 30 38 30 33 61 35 63 34 38 31 ... >,
dev-peer0.org1.example.com-eventstore-2|     offset: 128,
dev-peer0.org1.example.com-eventstore-2|     markedOffset: -1,
dev-peer0.org1.example.com-eventstore-2|     limit: 1194,
dev-peer0.org1.example.com-eventstore-2|     littleEndian: true,
dev-peer0.org1.example.com-eventstore-2|     noAssert: false } }
