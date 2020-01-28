## Introduction

It setup Fabric CA topology, according to the official [Fabric documentation](https://hyperledger-fabric-ca.readthedocs.io/en/latest/operations_guide.html)

Also, thanks for this reference material; is helpful.
https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/05/04/fabric-ca-example.html

## Getting Started

If you fork the project, or run repeated tests, you may remove `hosts` directories, which is .gitignore.

## MANDATORY: Bootstrap

- Setup TLS CA server
- Setup TLS client admin
- Register and enrol TLS for orderer and peers
- Register and enrol admins for orderer and peers
- Create genesis block and chanenl.tx

### Preparing Network and CAs

```shell script
// in terminal 1
docker-compose up -d
```

It should create rca-org0, rca-org1, rca-org2. Because the peers and orderer are not properly configured, those containers will fail to start, don't bother now.
You should see org0, org1, org2, tls directory created.

```shell script
// in terminal 2
// cd project_root/network
export CURRENT_DIR=$PWD/hosts

// bootstrap.sh will setup Fabric CA. After it, you should see new subdirectory 'hosts'
./bootstrap.sh

// restart in terminal 1. After it, you should additionally see organization peers, and clis. 
docker-compose down
docker-compose up -d

// Run logger tool
./monitordocker.sh
```

## OPTIONAL: MANUAL STEPS

### Create and join channel

```shell script
# create channel
docker exec -e CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org1/admin/msp cli-org1 \
peer channel create -c mychannel -f /tmp/hyperledger/org1/peer0/assets/channel.tx -o orderer.example.com:7050 \
--outputBlock /tmp/hyperledger/org1/peer0/assets/mychannel.block --tls --cafile /tmp/hyperledger/org1/peer0/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

# org1.peer0 join channel
docker exec -e CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org1/admin/msp -e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 cli-org1 \
peer channel join -b /tmp/hyperledger/org1/peer0/assets/mychannel.block

#  org1.peer1 join channel
docker exec -e CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org1/admin/msp -e CORE_PEER_ADDRESS=peer1.org1.example.com:8051 cli-org1 \
peer channel join -b /tmp/hyperledger/org1/peer0/assets/mychannel.block

# copy mychannel.block to every org
cp $CURRENT_DIR/org1/peer0/assets/mychannel.block $CURRENT_DIR/org2/peer0/assets/mychannel.block

# org2.peer0 join channel
docker exec -e CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org2/admin/msp -e CORE_PEER_ADDRESS=peer0.org2.example.com:9051 cli-org2 \
peer channel join -b /tmp/hyperledger/org2/peer0/assets/mychannel.block

# org2.peer1 join chanel
docker exec -e CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org2/admin/msp -e CORE_PEER_ADDRESS=peer1.org2.example.com:10051 cli-org2 \
peer channel join -b /tmp/hyperledger/org2/peer0/assets/mychannel.block
```

To explore later

```shell script
// BUG: anchor peer for org1
// This command is error. When peer0.org2 join the channel in the later step, there will lead to non-stop authenticateRemotePeer error.
// Skip this command for now, and figure it later.
// This boilerplate works well, without installing anchor peer
docker exec -e CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org1/admin/msp -e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 cli-org1 \
peer channel update -o orderer.example.com:7050 -c mychannel -f /tmp/hyperledger/org1/peer0/assets/Org1MSPanchors.tx \
--tls --cafile /tmp/hyperledger/org1/peer0/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
```

### install and instantiate chaincode at cli-org1

```shell script
# install cc to peer0.org1
docker exec -e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 -e CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org1/admin/msp cli-org1 \
peer chaincode install -n mycc -v 1.0 -p github.com/chaincode/abac/go

# install cc to peer0.org1
docker exec -e CORE_PEER_ADDRESS=peer1.org1.example.com:8051 -e CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org1/admin/msp cli-org1 \
peer chaincode install -n mycc -v 1.0 -p github.com/chaincode/abac/go

# install cc to peer0.org2
docker exec -e CORE_PEER_ADDRESS=peer0.org2.example.com:9051 -e CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org2/admin/msp cli-org2 \
peer chaincode install -n mycc -v 1.0 -p github.com/chaincode/abac/go

# install cc to peer1.org2
docker exec -e CORE_PEER_ADDRESS=peer1.org2.example.com:10051 -e CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org2/admin/msp cli-org2 \
peer chaincode install -n mycc -v 1.0 -p github.com/chaincode/abac/go

# instantiate
docker exec -e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 -e CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org1/admin/msp cli-org1 \
peer chaincode instantiate -C mychannel -n mycc -v 1.0 -c '{"Args":["init","a","100","b","200"]}' -o orderer.example.com:7050 --tls \
--cafile /tmp/hyperledger/org1/peer0/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

docker exec -e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 -e CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org1/admin/msp cli-org1 \
peer chaincode query -C mychannel -n mycc -c '{"Args":["query","a"]}'
# return 100

docker exec -e CORE_PEER_ADDRESS=peer0.org2.example.com:9051 -e CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org2/admin/msp cli-org2 \
peer chaincode invoke -C mychannel -n mycc -c '{"Args":["invoke","a","b","10"]}' \
--tls --cafile /tmp/hyperledger/org2/peer0/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

docker exec -e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 -e CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org1/admin/msp cli-org1 \
peer chaincode query -C mychannel -n mycc -c '{"Args":["query","a"]}'
# return 90
```

## Troubleshooting commands

```shell script
// decode cert
openssl x509 -in key.pem -text -noout

// decode mychannel.block
cd org1/assets
configtxlator proto_decode --type common.Block --input mychannel.block --output mychannel.block.json

// inpsect genesis block
cd org0
export FABRIC_CFG_PATH=$PWD && \
configtxgen -inspectBlock ./orderer/genesis.block

// inspect channel.tx
cd org0
export FABRIC_CFG_PATH=$PWD && \
configtxgen  -inspectChannelCreateTx ./orderer/channel.tx

// inside block, decode the individual cert
echo "LS0tLS1CRUdJTiBDRVJUSU....tLS0tCg==" |base64 -D >a.cert && \
openssl x509 -in a.cert -text

// list channel
peer channel list

// list affiliation
export FABRIC_CA_CLIENT_TLS_CERTFILES=/Users/tangross/dev/2019/fabric-ca/tls-ca/crypto/tls-ca-cert.pem  && \
export FABRIC_CA_CLIENT_HOME=/Users/tangross/dev/2019/fabric-ca/tls-ca/admin  && \
fabric-ca-client affiliation list
```
