# Import common.sh
. `pwd`/common.sh

# org0
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org0/msp/admincerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org0/msp/cacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org0/msp/tlscacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org0/msp/users

sudo cp  ${_CRYPTO_CONFIG_DIR}/org0/orderer1/msp/admincerts/org0-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/org0/msp/admincerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/org0/orderer1/assets/ca/org0-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/org0/msp/cacerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/org0/orderer1/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/org0/msp/tlscacerts

# org1
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org1/msp/admincerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org1/msp/cacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org1/msp/tlscacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org1/msp/users

sudo cp  ${_CRYPTO_CONFIG_DIR}/org1/peer1/msp/admincerts/org1-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/org1/msp/admincerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/org1/peer1/assets/ca/org1-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/org1/msp/cacerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/org1/peer1/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/org1/msp/tlscacerts

# org2
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org2/msp/admincerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org2/msp/cacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org2/msp/tlscacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/org2/msp/users

sudo cp  ${_CRYPTO_CONFIG_DIR}/org2/peer1/msp/admincerts/org2-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/org2/msp/admincerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/org2/peer1/assets/ca/org2-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/org2/msp/cacerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/org2/peer1/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/org2/msp/tlscacerts


cd ${_FABRIC_DIR}; 
export FABRIC_CFG_PATH=${PWD}
${_FABRIC_DIR}/../bin/configtxgen -profile OrgsOrdererGenesis -outputBlock genesis.block -channelID ordererchannel
${_FABRIC_DIR}/../bin/configtxgen -profile OrgsChannel -outputCreateChannelTx channel.tx -channelID mychannel

sudo cp genesis.block    ${_CRYPTO_CONFIG_DIR}/org0/orderer1
sudo cp genesis.block    ${_CRYPTO_CONFIG_DIR}/org0/orderer2
sudo cp genesis.block    ${_CRYPTO_CONFIG_DIR}/org0/orderer3
sudo cp genesis.block    ${_CRYPTO_CONFIG_DIR}/org0/orderer4
sudo cp genesis.block    ${_CRYPTO_CONFIG_DIR}/org0/orderer5
sudo mv channel.tx       ${_CRYPTO_CONFIG_DIR}/org1/peer1/assets
