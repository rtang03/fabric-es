# Import common.sh
. `pwd`/common.sh

# OrdererOrg
mkdir -p ${_CRYPTO_CONFIG_DIR}/example.com/msp/admincerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/example.com/msp/cacerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/example.com/msp/tlscacerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/example.com/msp/users

cp  ${_CRYPTO_CONFIG_DIR}/example.com/orderer1/msp/admincerts/example.com-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/example.com/msp/admincerts
cp  ${_CRYPTO_CONFIG_DIR}/example.com/orderer1/assets/ca/example.com-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/example.com/msp/cacerts
cp  ${_CRYPTO_CONFIG_DIR}/example.com/orderer1/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/example.com/msp/tlscacerts

# Org1MSP
mkdir -p ${_CRYPTO_CONFIG_DIR}/org1.example.com/msp/admincerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/org1.example.com/msp/cacerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/org1.example.com/msp/tlscacerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/org1.example.com/msp/users

cp  ${_CRYPTO_CONFIG_DIR}/org1.example.com/peer0/msp/admincerts/org1.example.com-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/org1.example.com/msp/admincerts
cp  ${_CRYPTO_CONFIG_DIR}/org1.example.com/peer0/assets/ca/org1.example.com-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/org1.example.com/msp/cacerts
cp  ${_CRYPTO_CONFIG_DIR}/org1.example.com/peer0/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/org1.example.com/msp/tlscacerts

# Org2MSP
mkdir -p ${_CRYPTO_CONFIG_DIR}/org2.example.com/msp/admincerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/org2.example.com/msp/cacerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/org2.example.com/msp/tlscacerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/org2.example.com/msp/users

cp  ${_CRYPTO_CONFIG_DIR}/org2.example.com/peer0/msp/admincerts/org2.example.com-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/org2.example.com/msp/admincerts
cp  ${_CRYPTO_CONFIG_DIR}/org2.example.com/peer0/assets/ca/org2.example.com-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/org2.example.com/msp/cacerts
cp  ${_CRYPTO_CONFIG_DIR}/org2.example.com/peer0/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/org2.example.com/msp/tlscacerts

# Org3MSP
mkdir -p ${_CRYPTO_CONFIG_DIR}/org3.neworg.com/msp/admincerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/org3.neworg.com/msp/cacerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/org3.neworg.com/msp/tlscacerts
mkdir -p ${_CRYPTO_CONFIG_DIR}/org3.neworg.com/msp/users

cp  ${_CRYPTO_CONFIG_DIR}/org3.neworg.com/peer0/msp/admincerts/org3.neworg.com-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/org3.neworg.com/msp/admincerts
cp  ${_CRYPTO_CONFIG_DIR}/org3.neworg.com/peer0/assets/ca/org3.neworg.com-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/org3.neworg.com/msp/cacerts
cp  ${_CRYPTO_CONFIG_DIR}/org3.neworg.com/peer0/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/org3.neworg.com/msp/tlscacerts

# Ubuntu requires ownership of orderer certs
sudo chown -R $(whoami) ${_CRYPTO_CONFIG_DIR}/example.com

cd ${_FABRIC_DIR}; 
export FABRIC_CFG_PATH=${PWD}
${_FABRIC_DIR}/../bin/configtxgen -profile OrgsOrdererGenesis -outputBlock genesis.block -channelID syschannel
${_FABRIC_DIR}/../bin/configtxgen -profile OrgsChannel -outputCreateChannelTx channel.tx -channelID eventstore

cp genesis.block    ${_CRYPTO_CONFIG_DIR}/example.com/orderer1
cp genesis.block    ${_CRYPTO_CONFIG_DIR}/example.com/orderer2
cp genesis.block    ${_CRYPTO_CONFIG_DIR}/example.com/orderer3
cp genesis.block    ${_CRYPTO_CONFIG_DIR}/example.com/orderer4
cp genesis.block    ${_CRYPTO_CONFIG_DIR}/example.com/orderer5
mv channel.tx       ${_CRYPTO_CONFIG_DIR}/org1.example.com/peer0/assets
