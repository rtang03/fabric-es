#!/usr/bin/env bash

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

export ARTIFACTS=./artifacts
export COMPOSE=compose.2org.yaml
export CONFIG=./config
export SCRIPTS=./scripts
export VERSION=1.0
export CRYPTO=/var/artifacts/crypto-config
export IMAGE_TAG=1.4.3
export CHAINCODE=../../packages/chaincode
export MEMBERS="'EtcMSP.member','PbctfpMSP.member'"

printMessage() {
  MESSAGE=$1
  CODE=$2

  if [ $2 -ne 0 ] ; then
    printf "${RED}${MESSAGE} failed${NC}\n"
    exit -1
  fi
  printf "${GREEN}Complete ${MESSAGE}${NC}\n\n"
  sleep 1
}

docker-compose -f $COMPOSE up -d

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

docker exec tls-ca-hktfp sh -c "/setup/enroll_tls.sh"

printMessage "enroll_tls.sh" $?

docker exec rca-hktfp sh -c "/setup/enroll_org0.sh"

printMessage "enroll_org0.sh" $?

docker exec rca-etradeconnect sh -c "/setup/enroll_org1.sh"

printMessage "enroll_org1.sh" $?

docker exec rca-pbctfp sh -c "/setup/enroll_org2.sh"

printMessage "enroll_org2.sh" $?

#docker-compose -f compose.base.yaml up -d
docker-compose -f $COMPOSE up -d

sleep 5

docker exec cli sh -c "mkdir -p ${CRYPTO}/HktfpMSP/msp/admincerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/HktfpMSP/msp/cacerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/HktfpMSP/msp/tlscacerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/HktfpMSP/msp/users"
docker exec cli sh -c "mkdir -p ${CRYPTO}/EtcMSP/msp/admincerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/EtcMSP/msp/cacerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/EtcMSP/msp/tlscacerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/EtcMSP/msp/users"
docker exec cli sh -c "mkdir -p ${CRYPTO}/PbctfpMSP/msp/admincerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/PbctfpMSP/msp/cacerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/PbctfpMSP/msp/tlscacerts"
docker exec cli sh -c "mkdir -p ${CRYPTO}/PbctfpMSP/msp/users"
docker exec cli sh -c "cp ${CRYPTO}/HktfpMSP/orderer0.hktfp.com/msp/admincerts/hktfp.com-admin-cert.pem ${CRYPTO}/HktfpMSP/msp/admincerts"
docker exec cli sh -c "cp ${CRYPTO}/HktfpMSP/orderer0.hktfp.com/assets/ca/hktfp.com-ca-cert.pem ${CRYPTO}/HktfpMSP/msp/cacerts"
docker exec cli sh -c "cp ${CRYPTO}/HktfpMSP/orderer0.hktfp.com/assets/tls-ca/tls-ca-cert.pem ${CRYPTO}/HktfpMSP/msp/tlscacerts"
docker exec cli sh -c "cp ${CRYPTO}/EtcMSP/peer0.etradeconnect.net/msp/admincerts/etradeconnect.net-admin-cert.pem ${CRYPTO}/EtcMSP/msp/admincerts"
docker exec cli sh -c "cp ${CRYPTO}/EtcMSP/peer0.etradeconnect.net/assets/ca/etradeconnect.net-ca-cert.pem ${CRYPTO}/EtcMSP/msp/cacerts"
docker exec cli sh -c "cp ${CRYPTO}/EtcMSP/peer0.etradeconnect.net/assets/tls-ca/tls-ca-cert.pem ${CRYPTO}/EtcMSP/msp/tlscacerts"
docker exec cli sh -c "cp ${CRYPTO}/PbctfpMSP/peer0.pbctfp.net/msp/admincerts/pbctfp.net-admin-cert.pem ${CRYPTO}/PbctfpMSP/msp/admincerts"
docker exec cli sh -c "cp ${CRYPTO}/PbctfpMSP/peer0.pbctfp.net/assets/ca/pbctfp.net-ca-cert.pem ${CRYPTO}/PbctfpMSP/msp/cacerts"
docker exec cli sh -c "cp ${CRYPTO}/PbctfpMSP/peer0.pbctfp.net/assets/tls-ca/tls-ca-cert.pem ${CRYPTO}/PbctfpMSP/msp/tlscacerts"

printf "\n################################"
printf "\n# CREATE GENESIS BLOCK/CONFIG.TX"
printf "\n################################\n"

docker exec -w /config -e FABRIC_CFG_PATH=/config cli \
 sh -c "configtxgen -profile OrgsOrdererGenesis -outputBlock genesis.block -channelID ordererchannel"

printMessage "Create genesis block" $?

docker exec -w /config -e FABRIC_CFG_PATH=/config cli \
 sh -c "configtxgen -profile OrgsChannel -outputCreateChannelTx channel.tx -channelID loanapp"

printMessage "Create channel.tx" $?

docker exec -w /config cli sh -c "mv genesis.block ${CRYPTO}/HktfpMSP/orderer0.hktfp.com"

docker exec -w /config cli sh -c "mv channel.tx ${CRYPTO}/EtcMSP/peer0.etradeconnect.net/assets"

#docker-compose -f compose.base.yaml up -d
docker-compose -f $COMPOSE up -d

sleep 5

docker exec cli sh -c "mkdir -p ${CRYPTO}/EtcMSP/admin/msp/admincerts"
docker exec cli sh -c "cp ${CRYPTO}/EtcMSP/peer0.etradeconnect.net/msp/admincerts/etradeconnect.net-admin-cert.pem /var/artifacts/crypto-config/EtcMSP/admin/msp/admincerts"

printf "\n################################"
printf "\n# CREATE CHANNEL"
printf "\n################################\n"

docker exec \
  -e CORE_PEER_ADDRESS=peer0-etradeconnect:7051 \
  -e CORE_PEER_LOCALMSPID=EtcMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp \
  cli peer channel create -c loanapp -f /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/channel.tx -o orderer0-hktfp:7050 \
    --outputBlock /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/loanapp.block \
    --tls --cafile /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

printMessage "Create channel" $?

printf "\n################################"
printf "\n# ORG1 - JOIN CHANNEL"
printf "\n################################\n"

docker exec \
  -e CORE_PEER_ADDRESS=peer0-etradeconnect:7051 \
  -e CORE_PEER_LOCALMSPID=EtcMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp \
  cli peer channel join -b /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/loanapp.block

printMessage "Join channel" $?

docker exec cli sh -c "peer channel getinfo -c loanapp"

printf "\n################################"
printf "\n# ORG2 - JOIN CHANNEL"
printf "\n################################\n"

docker exec cli sh -c "cp /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/loanapp.block /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/assets"
docker exec cli sh -c "mkdir -p ${CRYPTO}/PbctfpMSP/admin/msp/admincerts"
docker exec cli sh -c "cp ${CRYPTO}/PbctfpMSP/peer0.pbctfp.net/msp/admincerts/pbctfp.net-admin-cert.pem /var/artifacts/crypto-config/PbctfpMSP/admin/msp/admincerts"

docker exec -w /config \
  -e CORE_PEER_ADDRESS=peer0-pbctfp:7251 \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/PbctfpMSP/admin/msp \
  -e CORE_PEER_LOCALMSPID=PbctfpMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem \
  cli peer channel fetch newest /config/loanapp_newest.block \
    -o orderer0-hktfp:7050 -c loanapp --tls \
    --cafile /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

printMessage "Fetch block" $?

docker exec -w /config \
  -e CORE_PEER_ADDRESS=peer0-pbctfp:7251 \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/PbctfpMSP/admin/msp \
  -e CORE_PEER_LOCALMSPID=PbctfpMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem \
  cli sh -c "peer channel join -b /config/loanapp_newest.block"

printMessage "Join channel" $?

docker exec -w /config cli sh -c "rm loanapp_newest.block"

docker exec \
  -e CORE_PEER_ADDRESS=peer0-pbctfp:7251 \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/PbctfpMSP/admin/msp \
  -e CORE_PEER_LOCALMSPID=PbctfpMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem \
  cli sh -c "peer channel getinfo -c loanapp"

printf "\n################################"
printf "\n# INSTALL CHAINCODE"
printf "\n################################\n"

cp collections.json $CHAINCODE/collections.json
cd $CHAINCODE && yarn build

printMessage "Build chaincode" $?

# Install chaincode "eventstore" for org1
docker exec \
  -e CORE_PEER_ADDRESS=peer0-etradeconnect:7051 \
  -e CORE_PEER_LOCALMSPID=EtcMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp \
  cli peer chaincode install -n eventstore -v $VERSION -p /opt/gopath/src/github.com/hyperledger/fabric/chaincode -l node \
    --tls --cafile /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

printMessage "Install chaincode: eventstore for org1" $?

# Install chaincode privatedata for org1
docker exec \
  -e CORE_PEER_ADDRESS=peer0-etradeconnect:7051 \
  -e CORE_PEER_LOCALMSPID=EtcMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp \
  cli peer chaincode install -n privatedata -v $VERSION -p /opt/gopath/src/github.com/hyperledger/fabric/chaincode -l node \
    --tls --cafile /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

printMessage "Install chaincode: privatedata for org1" $?

docker exec \
  -e CORE_PEER_ADDRESS=peer0-etradeconnect:7051 \
  -e CORE_PEER_LOCALMSPID=EtcMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp \
  cli peer chaincode list --installed

# Install chaincode "eventstore" for org2
docker exec \
  -e CORE_PEER_ADDRESS=peer0-pbctfp:7251 \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/PbctfpMSP/admin/msp \
  -e CORE_PEER_LOCALMSPID=PbctfpMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem \
  cli peer chaincode install -n eventstore -v $VERSION -p /opt/gopath/src/github.com/hyperledger/fabric/chaincode -l node \
    --tls --cafile /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

printMessage "Install chaincode: eventstore for org2" $?

# Install chaincode "privatedata" for org2
docker exec \
  -e CORE_PEER_ADDRESS=peer0-pbctfp:7251 \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/PbctfpMSP/admin/msp \
  -e CORE_PEER_LOCALMSPID=PbctfpMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem \
  cli peer chaincode install -n privatedata -v $VERSION -p /opt/gopath/src/github.com/hyperledger/fabric/chaincode -l node \
    --tls --cafile /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

printMessage "Install chaincode: privatedata for org2" $?

# Instantiate chaincode
docker exec \
  -e CORE_PEER_ADDRESS=peer0-etradeconnect:7051 \
  -e CORE_PEER_LOCALMSPID=EtcMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp \
  cli peer chaincode instantiate -o orderer0-hktfp:7050 -C loanapp -n eventstore -v $VERSION -l node \
    -c '{"Args":["eventstore:instantiate"]}' -P "OR (${MEMBERS})" \
    --tls --cafile /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

printMessage "Instantiate chaincode: eventstore" $?

docker exec \
  -e CORE_PEER_ADDRESS=peer0-etradeconnect:7051 \
  -e CORE_PEER_LOCALMSPID=EtcMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp \
  cli peer chaincode instantiate -o orderer0-hktfp:7050 -C loanapp -n privatedata -v $VERSION -l node \
    -c '{"Args":["privatedata:instantiate"]}' -P "OR (${MEMBERS})" \
    --collections-config /opt/gopath/src/github.com/hyperledger/fabric/chaincode/collections.json \
    --tls --cafile /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

printMessage "Instantiate chaincode: privatedata" $?

# Invoke chaincode for org1
# Invoke event store
docker exec \
  -e CORE_PEER_ADDRESS=peer0-etradeconnect:7051 \
  -e CORE_PEER_LOCALMSPID=EtcMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp \
  cli peer chaincode invoke -o orderer0-hktfp:7050 -C loanapp -n eventstore --waitForEvent \
    -c '{"Args":["createCommit", "dev_entity", "ent_dev_1001", "0","[{\"type\":\"mon\"}]", "ent_dev_1001"]}' \
    --tls --cafile /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

printMessage "Invoke eventstore" $?

# Query event store
docker exec \
  -e CORE_PEER_ADDRESS=peer0-etradeconnect:7051 \
  -e CORE_PEER_LOCALMSPID=EtcMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp \
  cli peer chaincode invoke -o orderer0-hktfp:7050 -C loanapp -n eventstore --waitForEvent \
    -c '{"Args":["createCommit", "dev_entity", "ent_dev_1001", "0","[{\"type\":\"mon\"}]", "ent_dev_1001"]}' \
    --tls --cafile /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

printMessage "Query eventstore" $?

# Invoke private data
export COMMIT=$(echo -n "{\"eventString\":\"[]\"}" | base64 | tr -d \\n)
docker exec \
  -e CORE_PEER_ADDRESS=peer0-etradeconnect:7051 \
  -e CORE_PEER_LOCALMSPID=EtcMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp \
    cli peer chaincode invoke -o orderer0-hktfp:7050 -C loanapp -n privatedata --waitForEvent \
    -c '{"Args":["privatedata:createCommit","etcPrivateDetails","private_entityName","private_1001","0","private_1001"]}' \
    --transient "{\"eventstr\":\"$COMMIT\"}" \
    --tls --cafile /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

printMessage "Invoke privatedata" $?

# Query private data
docker exec \
  -e CORE_PEER_ADDRESS=peer0-etradeconnect:7051 \
  -e CORE_PEER_LOCALMSPID=EtcMSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp \
    cli peer chaincode invoke -o orderer0-hktfp:7050 -C loanapp -n privatedata --waitForEvent  \
    -c '{"Args":["privatedata:queryByEntityName","etcPrivateDetails","private_entityName"]}' \
    --tls --cafile /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

printMessage "Query privatedata" $?

printf "${GREEN}### BOOTSTRAP DONE ###${NC}\n\n"
