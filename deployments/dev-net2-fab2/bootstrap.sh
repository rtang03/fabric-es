#!/usr/bin/env bash

# $1 - docker compose files
# $2 - orderer code ("org0")
# $3 - first org ("org1")
# $4 - list of remaining orgs ("org2 org3")
# $5 - number of orgs (2org / 3org)

. ./scripts/setup.sh

docker-compose $1 up -d
printMessage "docker-compose up" $?
sleep 5

docker exec cli sh -c "cp -f /config/configtx.${5}.yaml /config/configtx.yaml"
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

docker exec -w /config cli sh -c "cp genesis.block ${CRYPTO}/${ORDERER_NAME}MSP/orderer1.${ORDERER_DOMAIN}"
docker exec -w /config cli sh -c "cp genesis.block ${CRYPTO}/${ORDERER_NAME}MSP/orderer2.${ORDERER_DOMAIN}"
docker exec -w /config cli sh -c "cp genesis.block ${CRYPTO}/${ORDERER_NAME}MSP/orderer3.${ORDERER_DOMAIN}"
docker exec -w /config cli sh -c "cp genesis.block ${CRYPTO}/${ORDERER_NAME}MSP/orderer4.${ORDERER_DOMAIN}"
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
printf "\n# JOIN CHANNEL - $3"
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
      --cafile /var/artifacts/crypto-config/Org0MSP/orderer0.org0.com/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
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

printf "\n######################"
printf "\n# Update Anchor Peer #"
printf "\n######################\n"
docker exec -w /config -e FABRIC_CFG_PATH=/config cli \
 sh -c "configtxgen -profile OrgsChannel -outputAnchorPeersUpdate /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/Org1Anchors.tx -channelID loanapp -asOrg Org1MSP"
printMessage "create Org1Anchors.tx" $?

docker exec \
  -e "CORE_PEER_ADDRESS=peer0-org1:7051" \
  -e "CORE_PEER_LOCALMSPID=Org1MSP" \
  -e "CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp" \
  cli peer channel update -c loanapp -f /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/Org1Anchors.tx \
    -o orderer0-org0:7050 \
    --tls --cafile /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
printMessage "update Org1Anchors.tx" $?

docker exec -w /config -e FABRIC_CFG_PATH=/config cli \
 sh -c "configtxgen -profile OrgsChannel -outputAnchorPeersUpdate /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/Org2Anchors.tx -channelID loanapp -asOrg Org2MSP"
printMessage "create Org2Anchors.tx" $?

docker exec \
  -e "CORE_PEER_ADDRESS=peer0-org2:7251" \
  -e "CORE_PEER_LOCALMSPID=Org2MSP" \
  -e "CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org2MSP/admin/msp" \
  cli peer channel update -c loanapp -f /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/Org2Anchors.tx \
    -o orderer0-org0:7050 \
    --tls --cafile /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
printMessage "update Org2Anchors.tx" $?

printf "\n######################"
printf "\n# Build Chaincode #"
printf "\n######################\n"
cd $CHAINCODE && yarn build
printMessage "Build chaincode" $?

PEER0_ORG1="docker exec
  -e CORE_PEER_ADDRESS=${FIRST_PEER}-${3}:${FIRST_PORT}
  -e CORE_PEER_LOCALMSPID=${FIRST_NAME}MSP
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${FIRST_NAME}MSP/${PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${FIRST_NAME}MSP/admin/msp
  cli peer "

printf "\n######################"
printf "\n# PACKAGE CC ON ORG1 #"
printf "\n######################\n"

echo "executing => $PEER0_ORG1 lifecycle chaincode package eventstore.tar.gz"

docker exec \
  cli peer lifecycle chaincode package eventstore.tar.gz \
  --path /opt/gopath/src/github.com/hyperledger/fabric/chaincode \
  --lang node \
  --label eventstorev1
printMessage "Package chaincode eventstorev1.tar.gz" $?


for ORG in $ORGLIST
do
  getConfig $ORG
  printf "\n#####################"
  printf "\n# INSTALL CHAINCODE #"
  printf "\n#####################\n"

  echo "Installing smart contract on ${PEER}-${ORG}"

  docker exec \
    -e "CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT}" \
    -e "CORE_PEER_LOCALMSPID=${NAME}MSP" \
    -e "CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem" \
    -e "CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp" \
    cli peer lifecycle chaincode install eventstore.tar.gz
  printMessage "Install chaincode: eventstore for $ORG" $?
done

for ORG in $ORGLIST
do
  getConfig $ORG

  PEER_ORG="docker exec
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT}
    -e CORE_PEER_LOCALMSPID=${NAME}MSP
    -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
    -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp
    cli peer"

  echo "Determining package ID for smart contract on peer0.org1.example.com"
  REGEX='Package ID: (.*), Label: eventstorev1'
  if [[ `${PEER_ORG} lifecycle chaincode queryinstalled` =~ $REGEX ]]; then
    PACKAGE_ID=${BASH_REMATCH[1]}
  else
    echo "Could not find package ID for eventstorev1 chaincode on peer0-org1"
    exit 1
  fi
  printMessage "query packageId ${PACKAGE_ID}" $?

  printf "\n#####################"
  printf "\n# APPROVE CHAINCODE #"
  printf "\n#####################\n"

  echo "executing => $PEER_ORG lifecycle approveformyorg ..."

  docker exec \
    -e "CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT}" \
    -e "CORE_PEER_LOCALMSPID=${NAME}MSP" \
    -e "CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem" \
    -e "CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp" \
    cli peer lifecycle chaincode approveformyorg \
    --tls \
    --cafile /var/artifacts/crypto-config/Org0MSP/orderer0.org0.com/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -o orderer0-org0:7050 \
    --channelID loanapp \
    --name eventstore \
    --version 1.0 \
    --package-id ${PACKAGE_ID} \
    --init-required \
    --signature-policy "AND('Org1MSP.member','Org2MSP.member')" \
    --sequence 1 \
    --waitForEvent

  printMessage "approveformyorg for eventstore for ${ORG}" $?

done

echo "Checkcommitreadiness for eventstore"

docker exec \
  -e CORE_PEER_ADDRESS=peer0-org1:7051 \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp \
  cli peer lifecycle chaincode checkcommitreadiness --tls \
  --cafile /var/artifacts/crypto-config/Org0MSP/orderer0.org0.com/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -o orderer0-org0:7050  \
  --channelID loanapp \
  --name eventstore \
  --init-required \
  --signature-policy "AND('Org1MSP.member','Org2MSP.member')" \
  --version 1.0 \
  --sequence 1

printMessage "checkcommitreadiness for eventstore" $?

printf "\n####################"
printf "\n# COMMIT CHAINCODE #"
printf "\n####################\n"

echo "executing => $PEER0_ORG1 lifecycle chaincode commit eventstore ..."

docker exec \
  -e CORE_PEER_ADDRESS=peer0-org1:7051 \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp \
  cli peer lifecycle chaincode commit \
  --tls \
  --cafile /var/artifacts/crypto-config/Org0MSP/orderer0.org0.com/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -o "${ORDERER_PEER}-${2}:${ORDERER_PORT}" \
  --channelID loanapp \
  --name eventstore \
  --init-required \
  --signature-policy "AND('Org1MSP.member','Org2MSP.member')" \
  --version 1.0 \
  --sequence 1 \
  --waitForEvent \
  --peerAddresses peer0-org1:7051 \
  --peerAddresses peer0-org2:7251 \
  --tlsRootCertFiles /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  --tlsRootCertFiles /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "commit chaincode for eventstore" $?

docker exec \
  -e CORE_PEER_ADDRESS=peer0-org1:7051 \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp \
  cli peer lifecycle chaincode querycommitted --channelID loanapp

sleep 2

printf "\n####################"
printf "\n# Init CHAINCODE #"
printf "\n####################\n"

echo "executing => $PEER0_ORG1 chaincode invoke"
docker exec \
  -e CORE_PEER_ADDRESS=peer0-org1:7051 \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp \
  cli peer chaincode invoke --isInit \
  -o orderer0-org0:7050 \
  -C loanapp \
  -n eventstore \
  -c '{"Args":["Init"]}' \
  --tls \
  --cafile /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  --waitForEvent \
  --waitForEventTimeout 300s \
  --peerAddresses peer0-org1:7051 \
  --tlsRootCertFiles /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  --peerAddresses peer0-org2:7251 \
  --tlsRootCertFiles /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
printMessage "init chaincode" $?

# Invoke event store
docker exec \
  -e "CORE_PEER_ADDRESS=peer0-org1:7051" \
  -e "CORE_PEER_LOCALMSPID=Org1MSP" \
  -e "CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem" \
  -e "CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp" \
  cli peer chaincode invoke \
    -o orderer0-org0:7050 \
    -C loanapp -n eventstore \
    -c '{"Args":["createCommit", "dev_entity", "ent_dev_org1", "0","[{\"type\":\"mon\"}]", "ent_dev_org1"]}' \
    --tls --cafile /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    --waitForEvent \
    --waitForEventTimeout 300s \
    --peerAddresses peer0-org1:7051 \
    --tlsRootCertFiles /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    --peerAddresses peer0-org2:7251 \
    --tlsRootCertFiles /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "invoke event store on org1 peer0" $?

# Query event store
docker exec \
  -e "CORE_PEER_ADDRESS=peer0-org1:7051" \
  -e "CORE_PEER_LOCALMSPID=Org1MSP" \
  -e "CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem" \
  -e "CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp" \
  cli peer chaincode query \
    -C loanapp -n eventstore \
    -c '{"Args":["eventstore:queryByEntityName","dev_entity"]}' \
    --tls --cafile /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "query event store on org1 peer0" $?

# Invoke private data
export EVENT_STR=$(echo -n "[{\"type\":\"testtype\"}]" | base64 | tr -d \\n);

docker exec \
  -e "CORE_PEER_ADDRESS=peer0-org1:7051" \
  -e "CORE_PEER_LOCALMSPID=Org1MSP" \
  -e "CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem" \
  -e "CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp" \
  cli peer chaincode invoke \
    -o orderer0-org0:7050 \
    -C loanapp -n eventstore \
    -c '{"Args":["privatedata:createCommit","private_entityName","private_org1","0","private_org1"]}' \
    --transient "{\"eventstr\":\"$EVENT_STR\"}" \
    --tls --cafile /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    --waitForEvent

 printMessage "invoke private data on org1 peer0" $?

sleep 1

# Query private data
docker exec \
  -e "CORE_PEER_ADDRESS=peer0-org1:7051" \
  -e "CORE_PEER_LOCALMSPID=Org1MSP" \
  -e "CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem" \
  -e "CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp" \
  cli peer chaincode query \
    -C loanapp -n eventstore \
    -c '{"Args":["privatedata:queryByEntityName","private_entityName"]}' \
    --tls --cafile /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
printMessage "query private data on org1 peer0" $?

sleep 1

# Invoke event store
docker exec \
  -e "CORE_PEER_ADDRESS=peer0-org2:7251" \
  -e "CORE_PEER_LOCALMSPID=Org2MSP" \
  -e "CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem" \
  -e "CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org2MSP/admin/msp" \
  cli peer chaincode invoke \
    -o orderer0-org0:7050 \
    -C loanapp -n eventstore \
    -c '{"Args":["eventstore:createCommit", "dev_entity", "ent_dev_org2", "0","[{\"type\":\"mon\"}]", "ent_dev_org2"]}' \
    --tls --cafile /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    --waitForEvent \
    --waitForEventTimeout 300s \
    --peerAddresses peer0-org1:7051 \
    --tlsRootCertFiles /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    --peerAddresses peer0-org2:7251 \
    --tlsRootCertFiles /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "invoke event store on org2 peer0" $?

sleep 1

# Query event store
docker exec \
  -e "CORE_PEER_ADDRESS=peer0-org2:7251" \
  -e "CORE_PEER_LOCALMSPID=Org2MSP" \
  -e "CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem" \
  -e "CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org2MSP/admin/msp" \
  cli peer chaincode query \
    -C loanapp -n eventstore \
    -c '{"Args":["eventstore:queryByEntityName","dev_entity"]}' \
    --tls --cafile /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "query event store on org2 peer0" $?

sleep 1

# Invoke private data
export EVENT_STR=$(echo -n "[{\"type\":\"testtype\"}]" | base64 | tr -d \\n);

docker exec \
 -e "CORE_PEER_ADDRESS=peer0-org2:7251" \
 -e "CORE_PEER_LOCALMSPID=Org2MSP" \
 -e "CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem" \
 -e "CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org2MSP/admin/msp" \
 cli peer chaincode invoke \
   -o orderer0-org0:7050 \
   -C loanapp -n eventstore \
   -c '{"Args":["privatedata:createCommit","private_entityName","private_org2","0","private_org2"]}' \
   --transient "{\"eventstr\":\"$EVENT_STR\"}" \
   --tls --cafile /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
   --waitForEvent

printMessage "invoke private data on org2 peer0" $?

sleep 1

# Query private data
docker exec \
 -e "CORE_PEER_ADDRESS=peer0-org2:7251" \
 -e "CORE_PEER_LOCALMSPID=Org2MSP" \
 -e "CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem" \
 -e "CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org2MSP/admin/msp" \
 cli peer chaincode query \
   -C loanapp -n eventstore \
   -c '{"Args":["privatedata:queryByEntityName","private_entityName"]}' \
   --tls --cafile /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

printMessage "query private data on org2 peer0" $?

sleep 1

docker exec cli sh -c "rm -f /config/configtx.yaml"

printf "${GREEN}### BOOTSTRAP DONE ###${NC}\n\n"
