#!/usr/bin/env bash

# todo: may accept input argument later
# export .env variables
# export $(grep -v '^#' ${_FABRIC_DIR}/.env | xargs)

. ./setup.sh

docker-compose -f $COMPOSE_1 up -d

printMessage "Docker-compose up" $?

sleep 1

# wait postgres container is up
canConnect=false
while [ "$canConnect"=false ]; do
    result=$(docker container exec -i postgres01 psql -h localhost -U postgres -d postgres -lqt | cut -f 1 -d \| | grep -e "postgres")
    printf "."
    if [[ "postgres"="$result" ]]
    then
 canConnect=true
 printf "${GREEN}psql: connected to server${NC}\n"
 break
    fi
done

sleep 1

printf "\n################################"
printf "\n# CREATE CRYPTO MATERIALS"
printf "\n################################\n"

docker exec tls-ca-org0 sh -c "/setup/enroll_tls.sh"
printMessage "enroll_tls.sh" $?

docker exec rca-org0 sh -c "/setup/enroll_org0.sh"
printMessage "enroll_org0.sh" $?

docker exec rca-org1 sh -c "/setup/enroll_org1.sh"
printMessage "enroll_org1.sh" $?

docker exec rca-org2 sh -c "/setup/enroll_org2.sh"
printMessage "enroll_org2.sh" $?

docker exec rca-org3 sh -c "/setup/enroll_org3.sh"
printMessage "enroll_org3.sh" $?

docker-compose -f $COMPOSE_1 up -d

sleep 5

docker exec cli sh -c "mkdir -p ${CRYPTO}/Org0MSP/msp/admincerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/Org0MSP/msp/cacerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/Org0MSP/msp/tlscacerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/Org0MSP/msp/users"
docker exec cli sh -c "mkdir -p ${CRYPTO}/Org1MSP/msp/admincerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/Org1MSP/msp/cacerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/Org1MSP/msp/tlscacerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/Org1MSP/msp/users"
docker exec cli sh -c "mkdir -p ${CRYPTO}/Org2MSP/msp/admincerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/Org2MSP/msp/cacerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/Org2MSP/msp/tlscacerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/Org2MSP/msp/users"
docker exec cli sh -c "mkdir -p ${CRYPTO}/Org3MSP/msp/admincerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/Org3MSP/msp/cacerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/Org3MSP/msp/tlscacerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/Org3MSP/msp/users"
docker exec cli sh -c "cp ${CRYPTO}/Org0MSP/orderer0.org0.com/msp/admincerts/org0.com-admin-cert.pem ${CRYPTO}/Org0MSP/msp/admincerts"
docker exec cli sh -c "cp ${CRYPTO}/Org0MSP/orderer0.org0.com/assets/ca/org0.com-ca-cert.pem ${CRYPTO}/Org0MSP/msp/cacerts"
docker exec cli sh -c "cp ${CRYPTO}/Org0MSP/orderer0.org0.com/assets/tls-ca/tls-ca-cert.pem ${CRYPTO}/Org0MSP/msp/tlscacerts"
docker exec cli sh -c "cp ${CRYPTO}/Org1MSP/peer0.org1.net/msp/admincerts/org1.net-admin-cert.pem ${CRYPTO}/Org1MSP/msp/admincerts"
docker exec cli sh -c "cp ${CRYPTO}/Org1MSP/peer0.org1.net/assets/ca/org1.net-ca-cert.pem ${CRYPTO}/Org1MSP/msp/cacerts"
docker exec cli sh -c "cp ${CRYPTO}/Org1MSP/peer0.org1.net/assets/tls-ca/tls-ca-cert.pem ${CRYPTO}/Org1MSP/msp/tlscacerts"
docker exec cli sh -c "cp ${CRYPTO}/Org2MSP/peer0.org2.net/msp/admincerts/org2.net-admin-cert.pem ${CRYPTO}/Org2MSP/msp/admincerts"
docker exec cli sh -c "cp ${CRYPTO}/Org2MSP/peer0.org2.net/assets/ca/org2.net-ca-cert.pem ${CRYPTO}/Org2MSP/msp/cacerts"
docker exec cli sh -c "cp ${CRYPTO}/Org2MSP/peer0.org2.net/assets/tls-ca/tls-ca-cert.pem ${CRYPTO}/Org2MSP/msp/tlscacerts"
docker exec cli sh -c "cp ${CRYPTO}/Org3MSP/peer0.org3.net/msp/admincerts/org3.net-admin-cert.pem ${CRYPTO}/Org3MSP/msp/admincerts"
docker exec cli sh -c "cp ${CRYPTO}/Org3MSP/peer0.org3.net/assets/ca/org3.net-ca-cert.pem ${CRYPTO}/Org3MSP/msp/cacerts"
docker exec cli sh -c "cp ${CRYPTO}/Org3MSP/peer0.org3.net/assets/tls-ca/tls-ca-cert.pem ${CRYPTO}/Org3MSP/msp/tlscacerts"

printf "\n################################"
printf "\n# CREATE GENESIS BLOCK/CONFIG.TX"
printf "\n################################\n"

docker exec -w /config -e FABRIC_CFG_PATH=/config cli \
 sh -c "configtxgen -profile OrgsOrdererGenesis -outputBlock genesis.block -channelID ordererchannel"

printMessage "Create genesis block" $?

docker exec -w /config -e FABRIC_CFG_PATH=/config cli \
 sh -c "configtxgen -profile OrgsChannel -outputCreateChannelTx channel.tx -channelID loanapp"

printMessage "Create channel.tx" $?

docker exec -w /config cli sh -c "mv genesis.block ${CRYPTO}/Org0MSP/orderer0.org0.com"

docker exec -w /config cli sh -c "mv channel.tx ${CRYPTO}/Org1MSP/peer0.org1.net/assets"

docker-compose -f $COMPOSE_1 up -d

sleep 5

docker exec cli sh -c "mkdir -p ${CRYPTO}/Org1MSP/admin/msp/admincerts"
docker exec cli sh -c "cp ${CRYPTO}/Org1MSP/peer0.org1.net/msp/admincerts/org1.net-admin-cert.pem /var/artifacts/crypto-config/Org1MSP/admin/msp/admincerts"

printf "\n################################"
printf "\n# CREATE CHANNEL"
printf "\n################################\n"

docker exec \
  -e CORE_PEER_ADDRESS=peer0-org1:7051 \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp \
  cli peer channel create -c loanapp -f /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/assets/channel.tx -o orderer0-org0:7050 \
    --outputBlock /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/assets/loanapp.block \
    --tls --cafile /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Create channel" $?

printf "\n################################"
printf "\n# ORG1 - JOIN CHANNEL"
printf "\n################################\n"

docker exec \
  -e CORE_PEER_ADDRESS=peer0-org1:7051 \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp \
  cli peer channel join -b /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/assets/loanapp.block

printMessage "Join channel" $?

docker exec cli sh -c "peer channel getinfo -c loanapp"

printf "\n################################"
printf "\n# ORG2 - JOIN CHANNEL"
printf "\n################################\n"

docker exec cli sh -c "cp /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/assets/loanapp.block /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/assets"
docker exec cli sh -c "mkdir -p ${CRYPTO}/Org2MSP/admin/msp/admincerts"
docker exec cli sh -c "cp ${CRYPTO}/Org2MSP/peer0.org2.net/msp/admincerts/org2.net-admin-cert.pem /var/artifacts/crypto-config/Org2MSP/admin/msp/admincerts"

docker exec -w /config \
  -e CORE_PEER_ADDRESS=peer0-org2:7251 \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org2MSP/admin/msp \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  cli peer channel fetch newest /config/loanapp_newest.block \
    -o orderer0-org0:7050 -c loanapp --tls \
    --cafile /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Fetch block" $?

docker exec -w /config \
  -e CORE_PEER_ADDRESS=peer0-org2:7251 \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org2MSP/admin/msp \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  cli sh -c "peer channel join -b /config/loanapp_newest.block"

printMessage "Join channel" $?

docker exec -w /config cli sh -c "rm loanapp_newest.block"

docker exec \
  -e CORE_PEER_ADDRESS=peer0-org2:7251 \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org2MSP/admin/msp \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  cli sh -c "peer channel getinfo -c loanapp"

printf "\n################################"
printf "\n# ORG3 - JOIN CHANNEL"
printf "\n################################\n"

docker exec cli sh -c "cp /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/assets/loanapp.block /var/artifacts/crypto-config/Org3MSP/peer0.org3.net/assets"
docker exec cli sh -c "mkdir -p ${CRYPTO}/Org3MSP/admin/msp/admincerts"
docker exec cli sh -c "cp ${CRYPTO}/Org3MSP/peer0.org3.net/msp/admincerts/org3.net-admin-cert.pem /var/artifacts/crypto-config/Org3MSP/admin/msp/admincerts"

docker exec -w /config \
  -e CORE_PEER_ADDRESS=peer0-org3:7451 \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org3MSP/admin/msp \
  -e CORE_PEER_LOCALMSPID=Org3MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org3MSP/peer0.org3.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  cli peer channel fetch newest /config/loanapp_newest.block \
    -o orderer0-org0:7050 -c loanapp --tls \
    --cafile /var/artifacts/crypto-config/Org3MSP/peer0.org3.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Fetch block" $?

docker exec -w /config \
  -e CORE_PEER_ADDRESS=peer0-org3:7451 \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org3MSP/admin/msp \
  -e CORE_PEER_LOCALMSPID=Org3MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org3MSP/peer0.org3.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  cli sh -c "peer channel join -b /config/loanapp_newest.block"

printMessage "Join channel" $?

docker exec -w /config cli sh -c "rm loanapp_newest.block"

docker exec \
  -e CORE_PEER_ADDRESS=peer0-org3:7451 \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org3MSP/admin/msp \
  -e CORE_PEER_LOCALMSPID=Org3MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org3MSP/peer0.org3.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  cli sh -c "peer channel getinfo -c loanapp"

printf "\n################################"
printf "\n# INSTALL CHAINCODE"
printf "\n################################\n"

cp ./build.gw-org1/collections.json $CHAINCODE/collections.json
cd $CHAINCODE && yarn build

printMessage "Build chaincode" $?

# Install chaincode "eventstore" for org1
docker exec \
  -e CORE_PEER_ADDRESS=peer0-org1:7051 \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp \
  cli peer chaincode install -n eventstore -v $VERSION -p /opt/gopath/src/github.com/hyperledger/fabric/chaincode -l node \
    --tls --cafile /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Install chaincode: eventstore for org1" $?

# Install chaincode privatedata for org1
docker exec \
  -e CORE_PEER_ADDRESS=peer0-org1:7051 \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp \
  cli peer chaincode install -n privatedata -v $VERSION -p /opt/gopath/src/github.com/hyperledger/fabric/chaincode -l node \
    --tls --cafile /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Install chaincode: privatedata for org1" $?

docker exec \
  -e CORE_PEER_ADDRESS=peer0-org1:7051 \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp \
  cli peer chaincode list --installed

# Install chaincode "eventstore" for org2
docker exec \
  -e CORE_PEER_ADDRESS=peer0-org2:7251 \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org2MSP/admin/msp \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  cli peer chaincode install -n eventstore -v $VERSION -p /opt/gopath/src/github.com/hyperledger/fabric/chaincode -l node \
    --tls --cafile /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Install chaincode: eventstore for org2" $?

# Install chaincode "privatedata" for org2
docker exec \
  -e CORE_PEER_ADDRESS=peer0-org2:7251 \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org2MSP/admin/msp \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  cli peer chaincode install -n privatedata -v $VERSION -p /opt/gopath/src/github.com/hyperledger/fabric/chaincode -l node \
    --tls --cafile /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Install chaincode: privatedata for org2" $?

# Install chaincode "eventstore" for org3
docker exec \
  -e CORE_PEER_ADDRESS=peer0-org3:7451 \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org3MSP/admin/msp \
  -e CORE_PEER_LOCALMSPID=Org3MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org3MSP/peer0.org3.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  cli peer chaincode install -n eventstore -v $VERSION -p /opt/gopath/src/github.com/hyperledger/fabric/chaincode -l node \
    --tls --cafile /var/artifacts/crypto-config/Org3MSP/peer0.org3.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Install chaincode: eventstore for org3" $?

# Install chaincode "privatedata" for org3
docker exec \
  -e CORE_PEER_ADDRESS=peer0-org3:7451 \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org3MSP/admin/msp \
  -e CORE_PEER_LOCALMSPID=Org3MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org3MSP/peer0.org3.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  cli peer chaincode install -n privatedata -v $VERSION -p /opt/gopath/src/github.com/hyperledger/fabric/chaincode -l node \
    --tls --cafile /var/artifacts/crypto-config/Org3MSP/peer0.org3.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Install chaincode: privatedata for org3" $?

# Instantiate chaincode
docker exec \
  -e CORE_PEER_ADDRESS=peer0-org1:7051 \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp \
  cli peer chaincode instantiate -o orderer0-org0:7050 -C loanapp -n eventstore -v $VERSION -l node \
    -c '{"Args":["eventstore:instantiate"]}' -P "OR (${MEMBERS})" \
    --tls --cafile /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Instantiate chaincode: eventstore" $?

docker exec \
  -e CORE_PEER_ADDRESS=peer0-org1:7051 \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp \
  cli peer chaincode instantiate -o orderer0-org0:7050 -C loanapp -n privatedata -v $VERSION -l node \
    -c '{"Args":["privatedata:instantiate"]}' -P "OR (${MEMBERS})" \
    --collections-config /opt/gopath/src/github.com/hyperledger/fabric/chaincode/collections.json \
    --tls --cafile /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Instantiate chaincode: privatedata" $?

# Invoke chaincode for org1
# Invoke event store
docker exec \
  -e CORE_PEER_ADDRESS=peer0-org1:7051 \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp \
  cli peer chaincode invoke -o orderer0-org0:7050 -C loanapp -n eventstore --waitForEvent \
    -c '{"Args":["createCommit", "dev_entity", "ent_dev_1001", "0","[{\"type\":\"mon\"}]", "ent_dev_1001"]}' \
    --tls --cafile /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Invoke eventstore for org1" $?

# Query event store
docker exec \
  -e CORE_PEER_ADDRESS=peer0-org1:7051 \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp \
  cli peer chaincode invoke -o orderer0-org0:7050 -C loanapp -n eventstore --waitForEvent \
    -c '{"Args":["createCommit", "dev_entity", "ent_dev_1001", "0","[{\"type\":\"mon\"}]", "ent_dev_1001"]}' \
    --tls --cafile /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Query eventstore for org1" $?

# Invoke private data
export COMMIT=$(echo -n "{\"eventString\":\"[]\"}" | base64 | tr -d \\n)
docker exec \
  -e CORE_PEER_ADDRESS=peer0-org1:7051 \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp \
    cli peer chaincode invoke -o orderer0-org0:7050 -C loanapp -n privatedata --waitForEvent \
    -c '{"Args":["privatedata:createCommit","org1PrivateDetails","private_entityName","private_1001","0","private_1001"]}' \
    --transient "{\"eventstr\":\"$COMMIT\"}" \
    --tls --cafile /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Invoke privatedata for org1" $?

# Query private data
docker exec \
  -e CORE_PEER_ADDRESS=peer0-org1:7051 \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp \
    cli peer chaincode invoke -o orderer0-org0:7050 -C loanapp -n privatedata --waitForEvent  \
    -c '{"Args":["privatedata:queryByEntityName","org1PrivateDetails","private_entityName"]}' \
    --tls --cafile /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Query privatedata for org1" $?

# Invoke chaincode for org2
# Invoke event store
docker exec \
  -e CORE_PEER_ADDRESS=peer0-org2:7251 \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org2MSP/admin/msp \
  cli peer chaincode invoke -o orderer0-org0:7050 -C loanapp -n eventstore --waitForEvent \
    -c '{"Args":["createCommit", "dev_entity", "ent_dev_1001", "0","[{\"type\":\"mon\"}]", "ent_dev_1001"]}' \
    --tls --cafile /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Invoke eventstore for org2" $?

# Query event store
docker exec \
  -e CORE_PEER_ADDRESS=peer0-org2:7251 \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org2MSP/admin/msp \
  cli peer chaincode invoke -o orderer0-org0:7050 -C loanapp -n eventstore --waitForEvent \
    -c '{"Args":["createCommit", "dev_entity", "ent_dev_1001", "0","[{\"type\":\"mon\"}]", "ent_dev_1001"]}' \
    --tls --cafile /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Query eventstore for org2" $?

# Invoke private data
export COMMIT=$(echo -n "{\"eventString\":\"[]\"}" | base64 | tr -d \\n)
docker exec \
  -e CORE_PEER_ADDRESS=peer0-org2:7251 \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org2MSP/admin/msp \
    cli peer chaincode invoke -o orderer0-org0:7050 -C loanapp -n privatedata --waitForEvent \
    -c '{"Args":["privatedata:createCommit","org2PrivateDetails","private_entityName","private_1001","0","private_1001"]}' \
    --transient "{\"eventstr\":\"$COMMIT\"}" \
    --tls --cafile /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Invoke privatedata for org2" $?

# Query private data
docker exec \
  -e CORE_PEER_ADDRESS=peer0-org2:7251 \
  -e CORE_PEER_LOCALMSPID=Org2MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org2MSP/admin/msp \
    cli peer chaincode invoke -o orderer0-org0:7050 -C loanapp -n privatedata --waitForEvent  \
    -c '{"Args":["privatedata:queryByEntityName","org2PrivateDetails","private_entityName"]}' \
    --tls --cafile /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Query privatedata for org2" $?

# Invoke chaincode for org3
# Invoke event store
docker exec \
  -e CORE_PEER_ADDRESS=peer0-org3:7451 \
  -e CORE_PEER_LOCALMSPID=Org3MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org3MSP/peer0.org3.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org3MSP/admin/msp \
  cli peer chaincode invoke -o orderer0-org0:7050 -C loanapp -n eventstore --waitForEvent \
    -c '{"Args":["createCommit", "dev_entity", "ent_dev_1001", "0","[{\"type\":\"mon\"}]", "ent_dev_1001"]}' \
    --tls --cafile /var/artifacts/crypto-config/Org3MSP/peer0.org3.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Invoke eventstore for org3" $?

# Query event store
docker exec \
  -e CORE_PEER_ADDRESS=peer0-org3:7451 \
  -e CORE_PEER_LOCALMSPID=Org3MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org3MSP/peer0.org3.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org3MSP/admin/msp \
  cli peer chaincode invoke -o orderer0-org0:7050 -C loanapp -n eventstore --waitForEvent \
    -c '{"Args":["createCommit", "dev_entity", "ent_dev_1001", "0","[{\"type\":\"mon\"}]", "ent_dev_1001"]}' \
    --tls --cafile /var/artifacts/crypto-config/Org3MSP/peer0.org3.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Query eventstore for org3" $?

# Invoke private data
export COMMIT=$(echo -n "{\"eventString\":\"[]\"}" | base64 | tr -d \\n)
docker exec \
  -e CORE_PEER_ADDRESS=peer0-org3:7451 \
  -e CORE_PEER_LOCALMSPID=Org3MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org3MSP/peer0.org3.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org3MSP/admin/msp \
    cli peer chaincode invoke -o orderer0-org0:7050 -C loanapp -n privatedata --waitForEvent \
    -c '{"Args":["privatedata:createCommit","org3PrivateDetails","private_entityName","private_1001","0","private_1001"]}' \
    --transient "{\"eventstr\":\"$COMMIT\"}" \
    --tls --cafile /var/artifacts/crypto-config/Org3MSP/peer0.org3.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Invoke privatedata for org3" $?

# Query private data
docker exec \
  -e CORE_PEER_ADDRESS=peer0-org3:7451 \
  -e CORE_PEER_LOCALMSPID=Org3MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org3MSP/peer0.org3.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org3MSP/admin/msp \
    cli peer chaincode invoke -o orderer0-org0:7050 -C loanapp -n privatedata --waitForEvent  \
    -c '{"Args":["privatedata:queryByEntityName","org3PrivateDetails","private_entityName"]}' \
    --tls --cafile /var/artifacts/crypto-config/Org3MSP/peer0.org3.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "Query privatedata for org3" $?

printf "${GREEN}### BOOTSTRAP DONE ###${NC}\n\n"
