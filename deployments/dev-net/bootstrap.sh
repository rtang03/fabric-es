#!/bin/bash

# $1 :String - docker compose files
# $2 :String - orderer code ("org0")
# $3 :Number - no. of org to be initiated. eg. 4 :  "org1 org2 org3 org4"

. ./scripts/setup.sh

ORGLIST=
for ((i=1;i<=$3;i++));
do
  ORGLIST="$ORGLIST org$i"
done

# Params of the first org
CNT=0
FIRST_CODE=($ORGLIST)
FIRST_CODE=${FIRST_CODE[0]}
getConfig $FIRST_CODE
FIRST_NAME=$NAME
FIRST_PEER=$PEER
FIRST_DOMAIN=$DOMAIN
FIRST_PORT=$PORT
MEMBERS=
for ORG in $ORGLIST; do
  getConfig $ORG
  if [ -z "${MEMBERS}" ]; then
    MEMBERS="'${NAME}MSP.member'"
  else
    MEMBERS="${MEMBERS},'${NAME}MSP.member'"
  fi
  CNT=$(( CNT + 1 ))
done

# Params of the orderer
getConfig $2
ORDERER_CODE=$2
ORDERER_NAME=$NAME
ORDERER_PEER=$PEER
ORDERER_DOMAIN=$DOMAIN
ORDERER_PORT=$PORT
ORDERER_LIST=$LIST


printf "\n##########################"
printf "\n# Bootstraping $3 orgs... #"
printf "\n##########################\n"
# Start up cli/ tls-ca-org0, rca-org[0..N]
docker-compose $1 up -d
printMessage "docker-compose up" $?
if [ $NEEDSUDO -eq 1 ]; then
  sudo chown -R $CURRENT_UID $ARTIFACTS
fi
sleep 3

docker exec cli sh -c "mv /config/configtx.org.yaml /config/configtx.yaml"

sleep 1

printf "\n###########################"
printf "\n# CREATE CRYPTO MATERIALS #"
printf "\n###########################\n"
docker exec -u $CURRENT_UID tls-ca-${ORDERER_CODE} sh -c "/setup/enroll-tls.sh ${ORDERER_CODE} \"$ORGLIST\""
printMessage "enroll-tls.sh" $?

docker exec -u $CURRENT_UID rca-${ORDERER_CODE} sh -c "/setup/enroll-orderer.sh ${ORDERER_CODE}"
printMessage "enroll-orderer.sh" $?

for ORG in $ORGLIST
do
  docker exec -u $CURRENT_UID rca-${ORG} sh -c "/setup/enroll-org.sh $ORG"
  printMessage "enroll-org.sh $ORG" $?
done

# Start up cli/ tls-ca-org0, rca-org[0..N], peer-org[0..N]
docker-compose $1 up -d
sleep 3

docker exec cli sh -c "/setup/copy-certs.sh ${CRYPTO} ${ORDERER_NAME} ${ORDERER_DOMAIN} ${ORDERER_PEER}"

for ORG in $ORGLIST
do
  getConfig $ORG
  docker exec cli sh -c "/setup/copy-certs.sh ${CRYPTO} ${NAME} ${DOMAIN} ${PEER}"
done

printf "\n##################################"
printf "\n# CREATE GENESIS BLOCK/CONFIG.TX #"
printf "\n##################################\n"
docker exec -w /config -e FABRIC_CFG_PATH=/config \
 cli sh -c "configtxgen -profile OrgsOrdererGenesis -outputBlock genesis.block -channelID ordererchannel"
printMessage "Create genesis block" $?

docker exec -w /config -e FABRIC_CFG_PATH=/config \
 cli sh -c "configtxgen -profile OrgsChannel -outputCreateChannelTx channel.tx -channelID loanapp"
printMessage "Create channel.tx" $?

for ODR in ${ORDERER_LIST}; do
  docker exec -w /config cli sh -c "cp genesis.block ${CRYPTO}/${ORDERER_NAME}MSP/${ODR}.${ORDERER_DOMAIN}"
done
docker exec -w /config cli sh -c "rm genesis.block"

docker exec -w /config cli sh -c "mv channel.tx ${CRYPTO}/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/assets"
# Start up cli/ tls-ca-org0, rca-org[0..N], peer-org[0..N], orderer-org[0..4]
docker-compose $1 up -d
sleep 3

docker exec cli sh -c "mkdir -p ${CRYPTO}/${FIRST_NAME}MSP/admin/msp/admincerts"
docker exec cli sh -c "cp ${CRYPTO}/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/msp/admincerts/${FIRST_DOMAIN}-admin-cert.pem $CRYPTO/${FIRST_NAME}MSP/admin/msp/admincerts"

printf "\n##################"
printf "\n# CREATE CHANNEL #"
printf "\n##################\n"
docker exec \
  -e CORE_PEER_ADDRESS=${FIRST_PEER}-${FIRST_CODE}:${FIRST_PORT} \
  -e CORE_PEER_LOCALMSPID=${FIRST_NAME}MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=$CRYPTO/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/${FIRST_NAME}MSP/admin/msp \
  cli peer channel create -c loanapp -f $CRYPTO/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/assets/channel.tx -o ${ORDERER_PEER}-${ORDERER_CODE}:${ORDERER_PORT} \
    --outputBlock $CRYPTO/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/assets/loanapp.block \
    --tls --cafile $CRYPTO/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
printMessage "Create channel" $?

printf "\n#######################"
printf "\n# JOIN CHANNEL - $FIRST_NAME #"
printf "\n#######################\n"
docker exec \
  -e CORE_PEER_ADDRESS=${FIRST_PEER}-${FIRST_CODE}:${FIRST_PORT} \
  -e CORE_PEER_LOCALMSPID=${FIRST_NAME}MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=$CRYPTO/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/${FIRST_NAME}MSP/admin/msp \
  cli peer channel join -b $CRYPTO/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/assets/loanapp.block
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
  printf "\n#######################"
  printf "\n# JOIN CHANNEL - $NAME #"
  printf "\n#######################\n"
  docker exec cli sh -c "cp $CRYPTO/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/assets/loanapp.block $CRYPTO/${NAME}MSP/${PEER}.${DOMAIN}/assets"
  docker exec cli sh -c "mkdir -p ${CRYPTO}/${NAME}MSP/admin/msp/admincerts"
  docker exec cli sh -c "cp ${CRYPTO}/${NAME}MSP/${PEER}.${DOMAIN}/msp/admincerts/${DOMAIN}-admin-cert.pem $CRYPTO/${NAME}MSP/admin/msp/admincerts"

  docker exec -w /config \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/${NAME}MSP/admin/msp \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=$CRYPTO/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    cli peer channel fetch newest /config/loanapp_newest.block \
      -o ${ORDERER_PEER}-${ORDERER_CODE}:${ORDERER_PORT} -c loanapp --tls \
      --cafile $CRYPTO/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
  printMessage "Fetch block" $?

  docker exec -w /config \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/${NAME}MSP/admin/msp \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=$CRYPTO/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    cli sh -c "peer channel join -b /config/loanapp_newest.block"
  printMessage "Join channel" $?

  docker exec -w /config cli sh -c "rm loanapp_newest.block"

  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/${NAME}MSP/admin/msp \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=$CRYPTO/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    cli sh -c "peer channel getinfo -c loanapp"
done

for ORG in $ORGLIST
do
  getConfig $ORG
  printf "\n#############################"
  printf "\n# UPDATE ANCHOR PEER - $NAME #"
  printf "\n#############################\n"
  docker exec -w /config -e FABRIC_CFG_PATH=/config cli \
   sh -c "configtxgen -profile OrgsChannel -outputAnchorPeersUpdate $CRYPTO/${NAME}MSP/${PEER}.${DOMAIN}/assets/${NAME}Anchors.tx -channelID loanapp -asOrg ${NAME}MSP"
  printMessage "create ${NAME}Anchors.tx" $?

  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/${NAME}MSP/admin/msp \
    cli peer channel update -c loanapp -f $CRYPTO/${NAME}MSP/${PEER}.${DOMAIN}/assets/${NAME}Anchors.tx \
      -o ${ORDERER_PEER}-${ORDERER_CODE}:${ORDERER_PORT} \
      --tls --cafile $CRYPTO/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
  printMessage "update ${NAME}Anchors.tx" $?
done

sleep 1

for ORG in $ORGLIST
do
  getConfig $ORG
  printf "\n##########################"
  printf "\n# BUILD CHAINCODE - $NAME #"
  printf "\n##########################\n"
  set -x
  cp -Rp $ARTIFACTS/connection.${ORG}.json $ARTIFACTS/connection.json
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

  printf "\n############################"
  printf "\n# INSTALL CHAINCODE - $NAME #"
  printf "\n############################\n"
  # Install chaincode "eventstore"
  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=$CRYPTO/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/${NAME}MSP/admin/msp \
    cli peer lifecycle chaincode install /var/artifacts/eventstore.tgz
  printMessage "Install chaincode: eventstore for $ORG" $?
  sleep 1
done

CMP_CC=
for ORG in $ORGLIST
do
  getConfig $ORG
  PEER_ORG="docker exec
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT}
    -e CORE_PEER_LOCALMSPID=${NAME}MSP
    -e CORE_PEER_TLS_ROOTCERT_FILE=$CRYPTO/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
    -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/${NAME}MSP/admin/msp
    cli peer"

  printf "\n#####################################"
  printf "\n# DEPLOY CHAINCODE CONTAINER - $NAME #"
  printf "\n#####################################\n"
  REGEX='Package ID: (.*), Label: eventstore'
  if [[ `${PEER_ORG} lifecycle chaincode queryinstalled` =~ $REGEX ]]; then
    export CHAINCODE_CCID=${BASH_REMATCH[1]}
  else
    echo "Could not find package ID"
    exit 1
  fi
  printMessage "determining package ID ${CHAINCODE_CCID}" $?

  CMP_CC="$CMP_CC -f $ARTIFACTS/compose.cc.${ORG}.yaml "
  docker-compose $1 $CMP_CC up -d --no-recreate

  printf "\n############################"
  printf "\n# APPROVE CHAINCODE - $NAME #"
  printf "\n############################\n"
  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=$CRYPTO/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/${NAME}MSP/admin/msp \
    cli peer lifecycle chaincode approveformyorg \
      --tls \
      --cafile $CRYPTO/${ORDERER_NAME}MSP/${ORDERER_PEER}.${ORDERER_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
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

printf "\n########################################"
printf "\n# CHECK commit readiness for EVENTSTORE #"
printf "\n########################################\n"
docker exec \
  -e CORE_PEER_ADDRESS=${FIRST_PEER}-${FIRST_CODE}:${FIRST_PORT} \
  -e CORE_PEER_LOCALMSPID=${FIRST_NAME}MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=$CRYPTO/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/${FIRST_NAME}MSP/admin/msp \
  cli peer lifecycle chaincode checkcommitreadiness --tls \
    --cafile $CRYPTO/${ORDERER_NAME}MSP/${ORDERER_PEER}.${ORDERER_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -o ${ORDERER_PEER}-${ORDERER_CODE}:${ORDERER_PORT}  \
    --channelID loanapp \
    --name eventstore \
    --init-required \
    --signature-policy "AND(${MEMBERS})" \
    --version 1.0 \
    --sequence 1
printMessage "check commit readiness for EVENTSTORE" $?

CMD_SFX=
for ORG in $ORGLIST; do
  getConfig $ORG
  CMD_SFX="$CMD_SFX \
    --peerAddresses ${PEER}-${ORG}:${PORT} \
    --tlsRootCertFiles $CRYPTO/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem"
done

printf "\n####################"
printf "\n# COMMIT CHAINCODE #"
printf "\n####################\n"
CMD="peer lifecycle chaincode commit \
    --tls \
    --cafile $CRYPTO/${ORDERER_NAME}MSP/${ORDERER_PEER}.${ORDERER_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
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
  -e CORE_PEER_TLS_ROOTCERT_FILE=$CRYPTO/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/${FIRST_NAME}MSP/admin/msp \
  cli sh -c "$CMD"
printMessage "commit chaincode for eventstore" $?

docker exec \
  -e CORE_PEER_ADDRESS=${FIRST_PEER}-${FIRST_CODE}:${FIRST_PORT} \
  -e CORE_PEER_LOCALMSPID=${FIRST_NAME}MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=$CRYPTO/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/${FIRST_NAME}MSP/admin/msp \
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
    --cafile $CRYPTO/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    --waitForEvent \
    --waitForEventTimeout 300s $CMD_SFX"
docker exec \
  -e CORE_PEER_ADDRESS=${FIRST_PEER}-${FIRST_CODE}:${FIRST_PORT} \
  -e CORE_PEER_LOCALMSPID=${FIRST_NAME}MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=$CRYPTO/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/${FIRST_NAME}MSP/admin/msp \
  cli sh -c "$CMD"
printMessage "init chaincode" $?

sleep 1

for ORG in $ORGLIST
do
  getConfig $ORG
  printf "\n###########################"
  printf "\n# Invoke CHAINCODE - $NAME #"
  printf "\n###########################\n"
  CMD="peer chaincode invoke \
      -o ${ORDERER_PEER}-${ORDERER_CODE}:${ORDERER_PORT} \
      -C loanapp -n eventstore \
      -c '{\"Args\":[\"createCommit\", \"dev_entity\", \"ent_dev_\", \"0\",\"[{\\\"type\\\":\\\"mon\\\"}]\", \"ent_dev_\",\"\"]}' \
      --tls --cafile $CRYPTO/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
      --waitForEvent \
      --waitForEventTimeout 300s $CMD_SFX"
  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=$CRYPTO/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/${NAME}MSP/admin/msp \
    cli sh -c "$CMD"
  printMessage "invoke eventstore on $ORG" $?

  # Query eventstore
  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=$CRYPTO/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/${NAME}MSP/admin/msp \
    cli peer chaincode query \
      -C loanapp -n eventstore \
      -c '{"Args":["eventstore:queryByEntityName","dev_entity"]}' \
      --tls --cafile $CRYPTO/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
  printMessage "Query eventstore for $ORG" $?

  # Invoke privatedata
  export EVENT_STR=$(echo -n "[{\"type\":\"testtype\"}]" | base64 | tr -d \\n);
  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=$CRYPTO/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/${NAME}MSP/admin/msp \
    cli peer chaincode invoke \
      -o ${ORDERER_PEER}-${ORDERER_CODE}:${ORDERER_PORT} \
      -C loanapp -n eventstore \
      -c '{"Args":["privatedata:createCommit","private_entityName","private_","0","private_"]}' \
      --transient "{\"eventstr\":\"$EVENT_STR\"}" \
      --tls --cafile $CRYPTO/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
      --waitForEvent
  printMessage "Invoke privatedata for $ORG" $?

  # Query privatedata
  docker exec \
    -e CORE_PEER_ADDRESS=${PEER}-${ORG}:${PORT} \
    -e CORE_PEER_LOCALMSPID=${NAME}MSP \
    -e CORE_PEER_TLS_ROOTCERT_FILE=$CRYPTO/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
    -e CORE_PEER_MSPCONFIGPATH=$CRYPTO/${NAME}MSP/admin/msp \
    cli peer chaincode query \
      -C loanapp -n eventstore \
      -c '{"Args":["privatedata:queryByEntityName","private_entityName"]}' \
      --tls --cafile $CRYPTO/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
  printMessage "Query privatedata for $ORG" $?
done

docker exec cli sh -c "rm -f /config/configtx.yaml"

printf "${GREEN}### BOOTSTRAP DONE ###${NC}\n\n"
