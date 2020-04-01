#!/usr/bin/env bash

# $1 - docker compose files
# $2 - orderer code ("org0")
# $3 - first org ("org1")
# $4 - list of remaining orgs ("org2 org3")

. ./scripts/setup.sh

CNT=1
for ORG in $4; do
  CNT=$(( CNT + 1 ))
done
echo "Bootstraping $CNT orgs..."

docker-compose $1 up -d
printMessage "docker-compose up" $?
sleep 5

docker exec cli sh -c "cp -f /config/configtx.${CNT}org.yaml /config/configtx.yaml"
sleep 1

printf "\n###########################"
printf "\n# CREATE CRYPTO MATERIALS #"
printf "\n###########################\n"

ORGLIST="$3 $4"
docker exec tls-ca-${2} sh -c "/setup/enroll-tls.sh ${2} \"$ORGLIST\""
printMessage "enroll-tls.sh" $?

docker exec rca-${2} sh -c "/setup/enroll-orderer.sh ${2}"
printMessage "enroll-orderer.sh" $?

for ORG in $ORGLIST
do
  docker exec rca-${ORG} sh -c "/setup/enroll-org.sh $ORG"
  printMessage "enroll-org.sh $ORG" $?
done

docker-compose $1 up -d
sleep 5

# Params of the orderer
getConfig ${2}
ORDERER_NAME=$NAME
ORDERER_PEER=$PEER
ORDERER_DOMAIN=$DOMAIN
ORDERER_PORT=$PORT
docker exec cli sh -c "/setup/copy-certs.sh ${CRYPTO} ${NAME} ${DOMAIN} ${PEER}"

for ORG in $ORGLIST
do
  getConfig $ORG
  docker exec cli sh -c "/setup/copy-certs.sh ${CRYPTO} ${NAME} ${DOMAIN} ${PEER}"
done

printf "\n##################################"
printf "\n# CREATE GENESIS BLOCK/CONFIG.TX #"
printf "\n##################################\n"

docker exec -w /config -e FABRIC_CFG_PATH=/config cli \
 sh -c "configtxgen -profile OrgsOrdererGenesis -outputBlock genesis.block -channelID ordererchannel"
printMessage "Create genesis block" $?

docker exec -w /config -e FABRIC_CFG_PATH=/config cli \
 sh -c "configtxgen -profile OrgsChannel -outputCreateChannelTx channel.tx -channelID loanapp"
printMessage "Create channel.tx" $?

docker exec -w /config cli sh -c "mv genesis.block ${CRYPTO}/${ORDERER_NAME}MSP/${ORDERER_PEER}.${ORDERER_DOMAIN}"

# Params of the first org
getConfig $3
FIRST_NAME=$NAME
FIRST_PEER=$PEER
FIRST_DOMAIN=$DOMAIN
FIRST_GATEWAY=$GATEWAY
FIRST_PORT=$PORT

docker exec -w /config cli sh -c "mv channel.tx ${CRYPTO}/${NAME}MSP/${PEER}.${DOMAIN}/assets"
docker-compose $1 up -d
sleep 5

docker exec cli sh -c "mkdir -p ${CRYPTO}/${NAME}MSP/admin/msp/admincerts"
docker exec cli sh -c "cp ${CRYPTO}/${NAME}MSP/${PEER}.${DOMAIN}/msp/admincerts/${DOMAIN}-admin-cert.pem /var/artifacts/crypto-config/${NAME}MSP/admin/msp/admincerts"

printf "\n##################"
printf "\n# CREATE CHANNEL #"
printf "\n##################\n"

docker exec \
  -e CORE_PEER_ADDRESS=${PEER}-${3}:${PORT} \
  -e CORE_PEER_LOCALMSPID=${NAME}MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp \
  cli peer channel create -c loanapp -f /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/assets/channel.tx -o ${ORDERER_PEER}-${2}:${ORDERER_PORT} \
    --outputBlock /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/assets/loanapp.block \
    --tls --cafile /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
printMessage "Create channel" $?

printf "\n###########################"
printf "\n# JOIN CHANNEL - $FIRST_NAME"
printf "\n###########################\n"

docker exec \
  -e CORE_PEER_ADDRESS=${PEER}-${3}:${PORT} \
  -e CORE_PEER_LOCALMSPID=${NAME}MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp \
  cli peer channel join -b /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/assets/loanapp.block
printMessage "Join channel" $?
docker exec cli sh -c "peer channel getinfo -c loanapp"

for ORG in $4
do
  getConfig $ORG
  printf "\n###########################"
  printf "\n# JOIN CHANNEL - $NAME"
  printf "\n###########################\n"

  docker exec cli sh -c "cp /var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/assets/loanapp.block /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/assets"
  docker exec cli sh -c "mkdir -p ${CRYPTO}/${NAME}MSP/admin/msp/admincerts"
  docker exec cli sh -c "cp ${CRYPTO}/${NAME}MSP/${PEER}.${DOMAIN}/msp/admincerts/${DOMAIN}-admin-cert.pem /var/artifacts/crypto-config/${NAME}MSP/admin/msp/admincerts"

  docker exec -w /config \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    cli peer channel fetch newest /config/loanapp_newest.block \
      -o ${ORDERER_PEER}-${2}:${ORDERER_PORT} -c loanapp --tls \
      --cafile /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
  printMessage "Fetch block" $?

  docker exec -w /config \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    cli sh -c "peer channel join -b /config/loanapp_newest.block"
  printMessage "Join channel" $?

  docker exec -w /config cli sh -c "rm loanapp_newest.block"

  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    cli sh -c "peer channel getinfo -c loanapp"
done

printf "\n#####################"
printf "\n# INSTALL CHAINCODE #"
printf "\n#####################\n"

cp ./build.${FIRST_GATEWAY}/collections.json $CHAINCODE/collections.json
cd $CHAINCODE && yarn build
printMessage "Build chaincode" $?

for ORG in $ORGLIST
do
  getConfig $ORG

  # Install chaincode "eventstore"
  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp \
    cli peer chaincode install -n eventstore -v $VERSION -p /opt/gopath/src/github.com/hyperledger/fabric/chaincode -l node \
      --tls --cafile /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
  printMessage "Install chaincode: eventstore for $ORG" $?

  # Install chaincode "privatedata"
  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp \
    cli peer chaincode install -n privatedata -v $VERSION -p /opt/gopath/src/github.com/hyperledger/fabric/chaincode -l node \
      --tls --cafile /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
  printMessage "Install chaincode: privatedata for $ORG" $?
done

# List chaincode
docker exec \
  -e CORE_PEER_ADDRESS=${FIRST_PEER}-${3}:${FIRST_PORT} \
  -e CORE_PEER_LOCALMSPID=${FIRST_NAME}MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${FIRST_NAME}MSP/admin/msp \
  cli peer chaincode list --installed

# Instantiate chaincode
docker exec \
  -e CORE_PEER_ADDRESS=${FIRST_PEER}-${3}:${FIRST_PORT} \
  -e CORE_PEER_LOCALMSPID=${FIRST_NAME}MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${FIRST_NAME}MSP/admin/msp \
  cli peer chaincode instantiate -o ${ORDERER_PEER}-${2}:${ORDERER_PORT} -C loanapp -n eventstore -v $VERSION -l node \
    -c '{"Args":["eventstore:instantiate"]}' -P "OR (${MEMBERS})" \
    --tls --cafile /var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
printMessage "Instantiate chaincode: eventstore" $?

docker exec \
  -e CORE_PEER_ADDRESS=${FIRST_PEER}-${3}:${FIRST_PORT} \
  -e CORE_PEER_LOCALMSPID=${FIRST_NAME}MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${FIRST_NAME}MSP/admin/msp \
  cli peer chaincode instantiate -o ${ORDERER_PEER}-${2}:${ORDERER_PORT} -C loanapp -n privatedata -v $VERSION -l node \
    -c '{"Args":["privatedata:instantiate"]}' -P "OR (${MEMBERS})" \
    --collections-config /opt/gopath/src/github.com/hyperledger/fabric/chaincode/collections.json \
    --tls --cafile /var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
printMessage "Instantiate chaincode: privatedata" $?

for ORG in $ORGLIST
do
  getConfig $ORG

  # Invoke eventstore
  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp \
    cli peer chaincode invoke -o ${ORDERER_PEER}-${2}:${ORDERER_PORT} -C loanapp -n eventstore --waitForEvent \
      -c '{"Args":["createCommit", "dev_entity", "ent_dev_1001", "0","[{\"type\":\"mon\"}]", "ent_dev_1001"]}' \
      --tls --cafile /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
  printMessage "Invoke eventstore for $ORG" $?

  # Query eventstore
  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp \
    cli peer chaincode invoke -o ${ORDERER_PEER}-${2}:${ORDERER_PORT} -C loanapp -n eventstore --waitForEvent \
      -c '{"Args":["createCommit", "dev_entity", "ent_dev_1001", "0","[{\"type\":\"mon\"}]", "ent_dev_1001"]}' \
      --tls --cafile /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
  printMessage "Query eventstore for $ORG" $?

  # Invoke privatedata
  export COMMIT=$(echo -n "{\"eventString\":\"[]\"}" | base64 | tr -d \\n)
  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp \
      cli peer chaincode invoke -o ${ORDERER_PEER}-${2}:${ORDERER_PORT} -C loanapp -n privatedata --waitForEvent \
      -c "{\"Args\":[\"privatedata:createCommit\",\"${ORG}PrivateDetails\",\"private_entityName\",\"private_1001\",\"0\",\"private_1001\"]}" \
      --transient "{\"eventstr\":\"$COMMIT\"}" \
      --tls --cafile /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
  printMessage "Invoke privatedata for $ORG" $?

  # Query privatedata
  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp \
      cli peer chaincode invoke -o ${ORDERER_PEER}-${2}:${ORDERER_PORT} -C loanapp -n privatedata --waitForEvent  \
      -c "{\"Args\":[\"privatedata:queryByEntityName\",\"${ORG}PrivateDetails\",\"private_entityName\"]}" \
      --tls --cafile /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
  printMessage "Query privatedata for $ORG" $?
done

#docker exec cli sh -c "rm -f /config/configtx.yaml"
#sleep 5

printf "${GREEN}### BOOTSTRAP DONE ###${NC}\n\n"
