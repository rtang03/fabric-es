# Import common.sh
. `pwd`/common.sh

# OrdererOrg
mkdir -p ${_CRYPTO_CONFIG_DIR}/OrdererMSP/msp/admincerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/OrdererMSP/msp/cacerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/OrdererMSP/msp/tlscacerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/OrdererMSP/msp/users

cp  ${_CRYPTO_CONFIG_DIR}/OrdererMSP/orderer1.example.com/msp/admincerts/example.com-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/OrdererMSP/msp/admincerts
cp  ${_CRYPTO_CONFIG_DIR}/OrdererMSP/orderer1.example.com/assets/ca/example.com-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/OrdererMSP/msp/cacerts
cp  ${_CRYPTO_CONFIG_DIR}/OrdererMSP/orderer1.example.com/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/OrdererMSP/msp/tlscacerts

# Org1MSP
mkdir -p ${_CRYPTO_CONFIG_DIR}/Org1MSP/msp/admincerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/Org1MSP/msp/cacerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/Org1MSP/msp/tlscacerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/Org1MSP/msp/users

cp  ${_CRYPTO_CONFIG_DIR}/Org1MSP/peer0.org1.example.com/msp/admincerts/org1.example.com-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/Org1MSP/msp/admincerts
cp  ${_CRYPTO_CONFIG_DIR}/Org1MSP/peer0.org1.example.com/assets/ca/org1.example.com-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/Org1MSP/msp/cacerts
cp  ${_CRYPTO_CONFIG_DIR}/Org1MSP/peer0.org1.example.com/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/Org1MSP/msp/tlscacerts

# Org2MSP
mkdir -p ${_CRYPTO_CONFIG_DIR}/Org2MSP/msp/admincerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/Org2MSP/msp/cacerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/Org2MSP/msp/tlscacerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/Org2MSP/msp/users

cp  ${_CRYPTO_CONFIG_DIR}/Org2MSP/peer0.org2.example.com/msp/admincerts/org2.example.com-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/Org2MSP/msp/admincerts
cp  ${_CRYPTO_CONFIG_DIR}/Org2MSP/peer0.org2.example.com/assets/ca/org2.example.com-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/Org2MSP/msp/cacerts
cp  ${_CRYPTO_CONFIG_DIR}/Org2MSP/peer0.org2.example.com/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/Org2MSP/msp/tlscacerts

# Org3MSP
mkdir -p ${_CRYPTO_CONFIG_DIR}/Org3MSP/msp/admincerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/Org3MSP/msp/cacerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/Org3MSP/msp/tlscacerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/Org3MSP/msp/users

cp  ${_CRYPTO_CONFIG_DIR}/Org3MSP/peer0.org3.neworg.com/msp/admincerts/org3.neworg.com-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/Org3MSP/msp/admincerts
cp  ${_CRYPTO_CONFIG_DIR}/Org3MSP/peer0.org3.neworg.com/assets/ca/org3.neworg.com-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/Org3MSP/msp/cacerts
cp  ${_CRYPTO_CONFIG_DIR}/Org3MSP/peer0.org3.neworg.com/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/Org3MSP/msp/tlscacerts

# Ubuntu requires ownership of orderer certs
chown -R $(whoami) ${_CRYPTO_CONFIG_DIR}/OrdererMSP/orderer1.example.com
chown -R $(whoami) ${_CRYPTO_CONFIG_DIR}/OrdererMSP/orderer2.example.com
chown -R $(whoami) ${_CRYPTO_CONFIG_DIR}/OrdererMSP/orderer3.example.com
chown -R $(whoami) ${_CRYPTO_CONFIG_DIR}/OrdererMSP/orderer4.example.com
chown -R $(whoami) ${_CRYPTO_CONFIG_DIR}/OrdererMSP/orderer5.example.com

cd ${_FABRIC_DIR}; 
export FABRIC_CFG_PATH=${PWD}
${_BIN_DIR}/configtxgen -profile OrgsOrdererGenesis -outputBlock genesis.block -channelID syschannel
${_BIN_DIR}/configtxgen -profile OrgsChannel -outputCreateChannelTx channel.tx -channelID eventstore

cp genesis.block    ${_CRYPTO_CONFIG_DIR}/OrdererMSP/orderer1.example.com
cp genesis.block    ${_CRYPTO_CONFIG_DIR}/OrdererMSP/orderer2.example.com
cp genesis.block    ${_CRYPTO_CONFIG_DIR}/OrdererMSP/orderer3.example.com
cp genesis.block    ${_CRYPTO_CONFIG_DIR}/OrdererMSP/orderer4.example.com
cp genesis.block    ${_CRYPTO_CONFIG_DIR}/OrdererMSP/orderer5.example.com
mv channel.tx       ${_CRYPTO_CONFIG_DIR}/Org1MSP/peer0.org1.example.com/assets

# Update Anchor peer
${_BIN_DIR}/configtxgen -profile OrgsChannel -outputAnchorPeersUpdate Org1MSPAnchors.tx -channelID eventstore -asOrg Org1MSP
mkdir -p ${_CRYPTO_CONFIG_DIR}/Org1MSP/peer0.org1.example.com/assets
mv Org1MSPAnchors.tx ${_CRYPTO_CONFIG_DIR}/Org1MSP/peer0.org1.example.com/assets
${_BIN_DIR}/configtxgen -profile OrgsChannel -outputAnchorPeersUpdate Org2MSPAnchors.tx -channelID eventstore -asOrg Org2MSP
mkdir -p ${_CRYPTO_CONFIG_DIR}/Org2MSP/peer0.org2.example.com/assets
mv Org2MSPAnchors.tx ${_CRYPTO_CONFIG_DIR}/Org2MSP/peer0.org2.example.com/assets
${_BIN_DIR}/configtxgen -profile OrgsChannel -outputAnchorPeersUpdate Org3MSPAnchors.tx -channelID eventstore -asOrg Org3MSP
mkdir -p ${_CRYPTO_CONFIG_DIR}/Org3MSP/peer0.org3.neworg.com/assets
mv Org3MSPAnchors.tx ${_CRYPTO_CONFIG_DIR}/Org3MSP/peer0.org3.neworg.com/assets
