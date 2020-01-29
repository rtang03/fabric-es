# Import common.sh
. `pwd`/common.sh

# hktfp
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/HktfpMSP/msp/admincerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/HktfpMSP/msp/cacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/HktfpMSP/msp/tlscacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/HktfpMSP/msp/users

sudo cp  ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer0.hktfp.com/msp/admincerts/hktfp.com-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/HktfpMSP/msp/admincerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer0.hktfp.com/assets/ca/hktfp.com-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/HktfpMSP/msp/cacerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer0.hktfp.com/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/HktfpMSP/msp/tlscacerts

# etc
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/EtcMSP/msp/admincerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/EtcMSP/msp/cacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/EtcMSP/msp/tlscacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/EtcMSP/msp/users

sudo cp  ${_CRYPTO_CONFIG_DIR}/EtcMSP/peer0.etradeconnect.net/msp/admincerts/etradeconnect.net-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/EtcMSP/msp/admincerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/EtcMSP/peer0.etradeconnect.net/assets/ca/etradeconnect.net-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/EtcMSP/msp/cacerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/EtcMSP/peer0.etradeconnect.net/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/EtcMSP/msp/tlscacerts

# pbctfp
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/msp/admincerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/msp/cacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/msp/tlscacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/msp/users

sudo cp  ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/peer0.pbctfp.net/msp/admincerts/pbctfp.net-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/msp/admincerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/peer0.pbctfp.net/assets/ca/pbctfp.net-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/msp/cacerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/peer0.pbctfp.net/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/msp/tlscacerts

# hsbc
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/HsbcMSP/msp/admincerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/HsbcMSP/msp/cacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/HsbcMSP/msp/tlscacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/HsbcMSP/msp/users

sudo cp  ${_CRYPTO_CONFIG_DIR}/HsbcMSP/peer0.hsbc.com.hk/msp/admincerts/hsbc.com.hk-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/HsbcMSP/msp/admincerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/HsbcMSP/peer0.hsbc.com.hk/assets/ca/hsbc.com.hk-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/HsbcMSP/msp/cacerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/HsbcMSP/peer0.hsbc.com.hk/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/HsbcMSP/msp/tlscacerts

# Ubuntu requires ownership of orderer certs
sudo chown -R $(whoami) ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer0.hktfp.com
sudo chown -R $(whoami) ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer1.hktfp.com
sudo chown -R $(whoami) ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer2.hktfp.com
sudo chown -R $(whoami) ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer3.hktfp.com
sudo chown -R $(whoami) ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer4.hktfp.com

cd ${_FABRIC_DIR}; 
export FABRIC_CFG_PATH=${PWD}
${_FABRIC_DIR}/../bin/configtxgen -profile OrgsOrdererGenesis -outputBlock genesis.block -channelID ordererchannel
${_FABRIC_DIR}/../bin/configtxgen -profile OrgsChannel -outputCreateChannelTx channel.tx -channelID loanapp

sudo cp genesis.block    ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer0.hktfp.com
sudo cp genesis.block    ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer1.hktfp.com
sudo cp genesis.block    ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer2.hktfp.com
sudo cp genesis.block    ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer3.hktfp.com
sudo cp genesis.block    ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer4.hktfp.com
sudo mv channel.tx       ${_CRYPTO_CONFIG_DIR}/EtcMSP/peer0.etradeconnect.net/assets

# Update Anchor peer
${_FABRIC_DIR}/../bin/configtxgen -profile OrgsChannel -outputAnchorPeersUpdate etcAnchors.tx -channelID loanapp -asOrg etc
${_FABRIC_DIR}/../bin/configtxgen -profile OrgsChannel -outputAnchorPeersUpdate pbctfpAnchors.tx -channelID loanapp -asOrg pbctfp
${_FABRIC_DIR}/../bin/configtxgen -profile OrgsChannel -outputAnchorPeersUpdate hsbcAnchors.tx -channelID loanapp -asOrg hsbc
