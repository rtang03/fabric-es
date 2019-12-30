# Import common.sh
. `pwd`/common.sh

# OrdererOrg
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/example.com/msp/admincerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/example.com/msp/cacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/example.com/msp/tlscacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/example.com/msp/users

sudo cp  ${_CRYPTO_CONFIG_DIR}/example.com/orderer1/msp/admincerts/example.com-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/example.com/msp/admincerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/example.com/orderer1/assets/ca/example.com-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/example.com/msp/cacerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/example.com/orderer1/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/example.com/msp/tlscacerts

# Org1MSP
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org1.example.com/msp/admincerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org1.example.com/msp/cacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org1.example.com/msp/tlscacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org1.example.com/msp/users

sudo cp  ${_CRYPTO_CONFIG_DIR}/org1.example.com/peer0/msp/admincerts/org1.example.com-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/org1.example.com/msp/admincerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/org1.example.com/peer0/assets/ca/org1.example.com-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/org1.example.com/msp/cacerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/org1.example.com/peer0/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/org1.example.com/msp/tlscacerts

# Org2MSP
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org2.example.com/msp/admincerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org2.example.com/msp/cacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org2.example.com/msp/tlscacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org2.example.com/msp/users

sudo cp  ${_CRYPTO_CONFIG_DIR}/org2.example.com/peer0/msp/admincerts/org2.example.com-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/org2.example.com/msp/admincerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/org2.example.com/peer0/assets/ca/org2.example.com-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/org2.example.com/msp/cacerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/org2.example.com/peer0/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/org2.example.com/msp/tlscacerts

# Org3MSP
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org3.neworg.com/msp/admincerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org3.neworg.com/msp/cacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org3.neworg.com/msp/tlscacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org3.neworg.com/msp/users

sudo cp  ${_CRYPTO_CONFIG_DIR}/org3.neworg.com/peer0/msp/admincerts/org3.neworg.com-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/org3.neworg.com/msp/admincerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/org3.neworg.com/peer0/assets/ca/org3.neworg.com-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/org3.neworg.com/msp/cacerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/org3.neworg.com/peer0/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/org3.neworg.com/msp/tlscacerts


cd ${_FABRIC_DIR}; 
export FABRIC_CFG_PATH=${PWD}
${_FABRIC_DIR}/../bin/configtxgen -profile OrgsOrdererGenesis -outputBlock genesis.block -channelID syschannel
${_FABRIC_DIR}/../bin/configtxgen -profile OrgsChannel -outputCreateChannelTx channel.tx -channelID eventstore

sudo cp genesis.block    ${_CRYPTO_CONFIG_DIR}/example.com/orderer1
sudo cp genesis.block    ${_CRYPTO_CONFIG_DIR}/example.com/orderer2
sudo cp genesis.block    ${_CRYPTO_CONFIG_DIR}/example.com/orderer3
sudo cp genesis.block    ${_CRYPTO_CONFIG_DIR}/example.com/orderer4
sudo cp genesis.block    ${_CRYPTO_CONFIG_DIR}/example.com/orderer5
sudo mv channel.tx       ${_CRYPTO_CONFIG_DIR}/org1.example.com/peer0/assets
