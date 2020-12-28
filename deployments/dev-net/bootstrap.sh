#!/bin/bash

# $1 - docker compose files
# $2 - orderer code ("org0")
# $3 - list of orgs ("org1 org2 org3")

. ./scripts/setup.sh

# Params of the first org
CNT=0
FIRST_CODE=
FIRST_NAME=
FIRST_PEER=
FIRST_DOMAIN=
FIRST_PORT=
MEMBERS=
for ORG in $3; do
  getConfig $ORG
  if [ $CNT -eq 0 ]; then
    FIRST_CODE=$ORG
    FIRST_NAME=$NAME
    FIRST_PEER=$PEER
    FIRST_DOMAIN=$DOMAIN
    FIRST_PORT=$PORT
    MEMBERS="'${NAME}MSP.member'"
  else
    MEMBERS="${MEMBERS},'${NAME}MSP.member'"
  fi
  CNT=$(( CNT + 1 ))
done

# Params of the orderer
getConfig $2
ORDERER_NAME=$NAME
ORDERER_LIST=$PEER
ORDERER_DOMAIN=$DOMAIN
ORDERER_PORT=$PORT
ORDERER_PEER=
for ODR in ${PEER}; do
  ORDERER_PEER=$ODR
  break
done

ORDERER_CODE=$2
ORGLIST="$3"

printf "\n##########################"
printf "\n# Bootstraping $CNT orgs... #"
printf "\n##########################\n"
docker-compose $1 up -d
printMessage "docker-compose up" $?
sleep 5

docker exec cli sh -c "cp -f /config/configtx.${CNT}org.yaml /config/configtx.yaml"

sleep 1

printf "\n###########################"
printf "\n# CREATE CRYPTO MATERIALS #"
printf "\n###########################\n"

docker exec tls-ca-${ORDERER_CODE} sh -c "/setup/enroll-tls.sh ${ORDERER_CODE} \"$ORGLIST\""
printMessage "enroll-tls.sh" $?

docker exec rca-${ORDERER_CODE} sh -c "/setup/enroll-orderer.sh ${ORDERER_CODE}"
printMessage "enroll-orderer.sh" $?

for ORG in $ORGLIST
do
  docker exec rca-${ORG} sh -c "/setup/enroll-org.sh $ORG"
  printMessage "enroll-org.sh $ORG" $?
done

docker-compose $1 up -d
sleep 5

docker exec cli sh -c "/setup/copy-certs.sh ${CRYPTO} ${ORDERER_NAME} ${ORDERER_DOMAIN} ${ORDERER_PEER}"

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

for ODR in ${ORDERER_LIST}; do
  docker exec -w /config cli sh -c "cp genesis.block ${CRYPTO}/${ORDERER_NAME}MSP/${ODR}.${ORDERER_DOMAIN}"
done
docker exec -w /config cli sh -c "rm genesis.block"

docker exec -w /config cli sh -c "mv channel.tx ${CRYPTO}/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/assets"
docker-compose $1 up -d
sleep 5

docker exec cli sh -c "mkdir -p ${CRYPTO}/${FIRST_NAME}MSP/admin/msp/admincerts"
docker exec cli sh -c "cp ${CRYPTO}/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/msp/admincerts/${FIRST_DOMAIN}-admin-cert.pem /var/artifacts/crypto-config/${FIRST_NAME}MSP/admin/msp/admincerts"

printf "\n##################"
printf "\n# CREATE CHANNEL #"
printf "\n##################\n"

docker exec \
  -e CORE_PEER_ADDRESS=${FIRST_PEER}-${FIRST_CODE}:${FIRST_PORT} \
  -e CORE_PEER_LOCALMSPID=${FIRST_NAME}MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${FIRST_NAME}MSP/admin/msp \
  cli peer channel create -c loanapp -f /var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/assets/channel.tx -o ${ORDERER_PEER}-${ORDERER_CODE}:${ORDERER_PORT} \
    --outputBlock /var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/assets/loanapp.block \
    --tls --cafile /var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
printMessage "Create channel" $?

printf "\n###########################"
printf "\n# JOIN CHANNEL - $FIRST_CODE"
printf "\n###########################\n"

docker exec \
  -e CORE_PEER_ADDRESS=${FIRST_PEER}-${FIRST_CODE}:${FIRST_PORT} \
  -e CORE_PEER_LOCALMSPID=${FIRST_NAME}MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${FIRST_NAME}MSP/admin/msp \
  cli peer channel join -b /var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/assets/loanapp.block
printMessage "Join channel" $?
docker exec cli sh -c "peer channel getinfo -c loanapp"

CNT=0
for ORG in $ORGLIST
do
  CNT=$(( CNT + 1 ))
  if [ $CNT -eq 1 ]; then
    continue
  fi

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
      -o ${ORDERER_PEER}-${ORDERER_CODE}:${ORDERER_PORT} -c loanapp --tls \
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

for ORG in $ORGLIST
do
  getConfig $ORG
  printf "\n###########################"
  printf "\n# UPDATE ANCHOR PEER - $NAME"
  printf "\n###########################\n"

  docker exec -w /config -e FABRIC_CFG_PATH=/config cli \
   sh -c "configtxgen -profile OrgsChannel -outputAnchorPeersUpdate /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/assets/${NAME}Anchors.tx -channelID loanapp -asOrg ${NAME}MSP"
  printMessage "create ${NAME}Anchors.tx" $?

  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp \
    cli peer channel update -c loanapp -f /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/assets/${NAME}Anchors.tx \
      -o ${ORDERER_PEER}-${ORDERER_CODE}:${ORDERER_PORT} \
      --tls --cafile /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
  printMessage "update ${NAME}Anchors.tx" $?
done

sleep 1

for ORG in $ORGLIST
do
  printf "\n###################"
  printf "\n# BUILD CHAINCODE #"
  printf "\n###################\n"
  set -x
  cat $CONFIG/connection.${ORG}.json > $ARTIFACTS/connection.json
  res=$?
  set +x
  printMessage "copy connection.json" $res

  set -x
  cp $CONFIG/metadata.json $ARTIFACTS
  res=$?
  set +x
  printMessage "copy metadata.json" $res

  set -x
  cd $ARTIFACTS && tar cfz code.tar.gz connection.json && tar cfz eventstore.tgz code.tar.gz metadata.json
  res=$?
  set +x
  printMessage "tar package" $res

  cd $CURRENT_DIR && sleep 1

  getConfig $ORG
  printf "\n############################"
  printf "\n# INSTALL CHAINCODE - $NAME #"
  printf "\n############################\n"

  # Install chaincode "eventstore"
  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp \
    cli peer lifecycle chaincode install /var/artifacts/eventstore.tgz
  printMessage "Install chaincode: eventstore for $ORG" $?
  sleep 1
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

  echo "Determining package ID"
  REGEX='Package ID: (.*), Label: eventstore'
  if [[ `${PEER_ORG} lifecycle chaincode queryinstalled` =~ $REGEX ]]; then
    export CHAINCODE_CCID=${BASH_REMATCH[1]}
  else
    echo "Could not find package ID"
    exit 1
  fi
  printMessage "query packageId ${CHAINCODE_CCID}" $?

  printf "\n############################"
  printf "\n# DEPLOY CHAINCODE CONTAINER - $NAME #"
  printf "\n############################\n"
  docker-compose $1 -f compose.cc.${ORG}.yaml up -d

  printf "\n############################"
  printf "\n# APPROVE CHAINCODE - $NAME #"
  printf "\n############################\n"

  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp \
    cli peer lifecycle chaincode approveformyorg \
      --tls \
      --cafile /var/artifacts/crypto-config/${ORDERER_NAME}MSP/${ORDERER_PEER}.${ORDERER_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
      -o ${ORDERER_PEER}-${ORDERER_CODE}:${ORDERER_PORT} \
      --channelID loanapp \
      --name eventstore \
      --version 1.0 \
      --package-id ${CHAINCODE_CCID} \
      --init-required \
      --signature-policy "AND(${MEMBERS})" \
      --sequence 1 \
      --waitForEvent
  printMessage "approveformyorg for eventstore for ${ORG}" $?
done

echo "Checkcommitreadiness for eventstore"
docker exec \
  -e CORE_PEER_ADDRESS=${FIRST_PEER}-${FIRST_CODE}:${FIRST_PORT} \
  -e CORE_PEER_LOCALMSPID=${FIRST_NAME}MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${FIRST_NAME}MSP/admin/msp \
  cli peer lifecycle chaincode checkcommitreadiness --tls \
    --cafile /var/artifacts/crypto-config/${ORDERER_NAME}MSP/${ORDERER_PEER}.${ORDERER_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -o ${ORDERER_PEER}-${ORDERER_CODE}:${ORDERER_PORT}  \
    --channelID loanapp \
    --name eventstore \
    --init-required \
    --signature-policy "AND(${MEMBERS})" \
    --version 1.0 \
    --sequence 1
printMessage "checkcommitreadiness for eventstore" $?

CMD_SFX=
for ORG in $ORGLIST; do
  getConfig $ORG
  CMD_SFX="$CMD_SFX \
    --peerAddresses ${PEER}-${ORG}:${PORT} \
    --tlsRootCertFiles /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem"
done

printf "\n####################"
printf "\n# COMMIT CHAINCODE #"
printf "\n####################\n"
CMD="peer lifecycle chaincode commit \
    --tls \
    --cafile /var/artifacts/crypto-config/${ORDERER_NAME}MSP/${ORDERER_PEER}.${ORDERER_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -o ${ORDERER_PEER}-${ORDERER_CODE}:${ORDERER_PORT} \
    --channelID loanapp \
    --name eventstore \
    --init-required \
    --signature-policy \"AND(${MEMBERS})\" \
    --version 1.0 \
    --sequence 1 \
    --waitForEvent $CMD_SFX"
docker exec \
  -e CORE_PEER_ADDRESS=${FIRST_PEER}-${FIRST_CODE}:${FIRST_PORT} \
  -e CORE_PEER_LOCALMSPID=${FIRST_NAME}MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${FIRST_NAME}MSP/admin/msp \
  cli sh -c "$CMD"
printMessage "commit chaincode for eventstore" $?

docker exec \
  -e CORE_PEER_ADDRESS=${FIRST_PEER}-${FIRST_CODE}:${FIRST_PORT} \
  -e CORE_PEER_LOCALMSPID=${FIRST_NAME}MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${FIRST_NAME}MSP/admin/msp \
  cli peer lifecycle chaincode querycommitted --channelID loanapp
printMessage "querycommitted" $?

printf "\n##################"
printf "\n# Init CHAINCODE #"
printf "\n##################\n"
CMD="peer chaincode invoke --isInit \
    -o ${ORDERER_PEER}-${ORDERER_CODE}:${ORDERER_PORT} \
    -C loanapp \
    -n eventstore \
    -c '{\"Args\":[\"Init\"]}' \
    --tls \
    --cafile /var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    --waitForEvent \
    --waitForEventTimeout 300s $CMD_SFX"
docker exec \
  -e CORE_PEER_ADDRESS=${FIRST_PEER}-${FIRST_CODE}:${FIRST_PORT} \
  -e CORE_PEER_LOCALMSPID=${FIRST_NAME}MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${FIRST_NAME}MSP/admin/msp \
  cli sh -c "$CMD"
printMessage "init chaincode" $?

sleep 1

for ORG in $ORGLIST
do
  getConfig $ORG

  # Invoke eventstore
  CMD="peer chaincode invoke \
      -o ${ORDERER_PEER}-${ORDERER_CODE}:${ORDERER_PORT} \
      -C loanapp -n eventstore \
      -c '{\"Args\":[\"createCommit\", \"dev_entity\", \"ent_dev_\", \"0\",\"[{\\\"type\\\":\\\"mon\\\"}]\", \"ent_dev_\"]}' \
      --tls --cafile /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
      --waitForEvent \
      --waitForEventTimeout 300s $CMD_SFX"
  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp \
    cli sh -c "$CMD"
  printMessage "invoke eventstore on $ORG" $?

  # Query eventstore
  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp \
    cli peer chaincode query \
      -C loanapp -n eventstore \
      -c '{"Args":["eventstore:queryByEntityName","dev_entity"]}' \
      --tls --cafile /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
  printMessage "Query eventstore for $ORG" $?

  # Invoke privatedata
  export EVENT_STR=$(echo -n "[{\"type\":\"testtype\"}]" | base64 | tr -d \\n);
  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp \
    cli peer chaincode invoke \
      -o ${ORDERER_PEER}-${ORDERER_CODE}:${ORDERER_PORT} \
      -C loanapp -n eventstore \
      -c '{"Args":["privatedata:createCommit","private_entityName","private_","0","private_"]}' \
      --transient "{\"eventstr\":\"$EVENT_STR\"}" \
      --tls --cafile /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
      --waitForEvent
  printMessage "Invoke privatedata for $ORG" $?

  # Query privatedata
  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${NAME}MSP/admin/msp \
    cli peer chaincode query \
      -C loanapp -n eventstore \
      -c '{"Args":["privatedata:queryByEntityName","private_entityName"]}' \
      --tls --cafile /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
  printMessage "Query privatedata for $ORG" $?
done

docker exec cli sh -c "rm -f /config/configtx.yaml"

printf "${GREEN}### BOOTSTRAP DONE ###${NC}\n\n"
