#!/usr/bin/env bash
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

export CRYPTO=/var/artifacts/crypto-config

docker-compose -f docker-compose.fabric_only.yaml up -d

if [ $? -ne 0 ] ; then
  printf "${RED}Docker Compose Failed${NC}\n"
  exit -1
fi

sleep 2

canConnect=false
while [ "$canConnect"=false ]; do
    result=$(docker container exec -i postgres-dev psql -h localhost -U postgres -d postgres -lqt | cut -f 1 -d \| | grep -e "postgres")
    printf "."
    if [[ "postgres"="$result" ]]
    then
 canConnect=true
 printf "${GREEN}psql: connected to server${NC}\n"
 break
    fi
done

sleep 2

################################
# CREATE CRYPTO MATERIALS
################################

docker exec tls-ca.hktfp.com sh -c "/setup/enroll_tls.sh"
if [ $? -ne 0 ] ; then
  printf "${RED}/setup/enroll_tls.sh Failed${NC}\n"
  exit -1
fi
printf "${GREEN}complete enroll_tls.sh${NC}\n"

sleep 2

docker exec rca.hktfp.com sh -c "/setup/enroll_org0.sh"
if [ $? -ne 0 ] ; then
  printf "${RED}/setup/enroll_org0.sh Failed${NC}\n"
  exit -1
fi
printf "${GREEN}complete enroll_org0.sh${NC}\n"

sleep 2

docker exec rca.etradeconnect.net sh -c "/setup/enroll_org1.sh"
if [ $? -ne 0 ] ; then
  printf "${RED}/setup/enroll_org1.sh Failed${NC}\n"
  exit -1
fi
printf "${GREEN}complete enroll_org1.sh${NC}\n"

sleep 2

docker exec rca.pbctfp.net sh -c "/setup/enroll_org2.sh"
if [ $? -ne 0 ] ; then
  printf "${RED}/setup/enroll_org2.sh Failed${NC}\n"
  exit -1
fi
printf "${GREEN}complete enroll_org2.sh${NC}\n"

sleep 2

docker-compose -f docker-compose.fabric_only.yaml up -d

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

################################
# CREATE GENESIS BLOCK/CONFIG.TX
################################

docker exec -w /config -e FABRIC_CFG_PATH=/config cli \
 sh -c "configtxgen -profile OrgsOrdererGenesis -outputBlock genesis.block -channelID ordererchannel"

docker exec -w /config -e FABRIC_CFG_PATH=/config cli \
 sh -c "configtxgen -profile OrgsChannel -outputCreateChannelTx channel.tx -channelID loanapp"

docker exec -w /config cli sh -c "cp genesis.block ${CRYPTO}/HktfpMSP/orderer0.hktfp.com"

docker exec -w /config cli sh -c "mv channel.tx ${CRYPTO}/EtcMSP/peer0.etradeconnect.net/assets"

docker-compose -f docker-compose.fabric_only.yaml up -d

sleep 5

docker exec cli sh -c "mkdir -p ${CRYPTO}/EtcMSP/admin/msp/admincerts"
docker exec cli sh -c "cp ${CRYPTO}/EtcMSP/peer0.etradeconnect.net/msp/admincerts/etradeconnect.net-admin-cert.pem /var/artifacts/crypto-config/EtcMSP/admin/msp/admincerts"

################################
# CREATE CHANNEL
################################

docker exec -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp cli \
  peer channel create -c loanapp -f /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/channel.tx -o orderer0.hktfp.com:7050 \
    --outputBlock /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/loanapp.block \
    --tls --cafile /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

################################
# ORG1 - JOIN CHANNEL
################################

docker exec -e CORE_PEER_ADDRESS=peer0.etradeconnect.net:7051 cli \
  peer channel join -b /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/loanapp.block

sleep 1

docker exec cli sh -c "peer channel getinfo -c loanapp"

################################
# ORG2 - JOIN CHANNEL
################################
docker exec cli sh -c "cp /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/loanapp.block /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/assets"
docker exec cli sh -c "mkdir -p ${CRYPTO}/PbctfpMSP/admin/msp/admincerts"
docker exec cli sh -c "cp ${CRYPTO}/PbctfpMSP/peer0.pbctfp.net/msp/admincerts/pbctfp.net-admin-cert.pem /var/artifacts/crypto-config/PbctfpMSP/admin/msp/admincerts"

docker exec -w /config \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/PbctfpMSP/admin/msp \
  -e CORE_PEER_LOCALMSPID=PbctfpMSP \
  -e CORE_PEER_ADDRESS="peer0.pbctfp.net:7251" \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem \
  cli peer channel fetch newest /config/loanapp_newest.block \
    -o orderer0.hktfp.com:7050 -c loanapp --tls \
    --cafile /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

sleep 1

docker exec -w /config \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/PbctfpMSP/admin/msp \
  -e CORE_PEER_LOCALMSPID=PbctfpMSP \
  -e CORE_PEER_ADDRESS="peer0.pbctfp.net:7251" \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem \
  cli sh -c "peer channel join -b /config/loanapp_newest.block"

sleep 1

docker exec \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/PbctfpMSP/admin/msp \
  -e CORE_PEER_LOCALMSPID=PbctfpMSP \
  -e CORE_PEER_ADDRESS="peer0.pbctfp.net:7251" \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem \
  cli sh -c "peer channel getinfo -c loanapp"

#docker-compose -p ci -f ./docker-compose.ci.yaml kill
#docker-compose -p ci -f ./docker-compose.ci.yaml rm -f
