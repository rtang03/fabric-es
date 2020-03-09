# Import common.sh
. `pwd`/common.sh

# hktfp
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/HktfpMSP/msp/admincerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/HktfpMSP/msp/cacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/HktfpMSP/msp/tlscacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/HktfpMSP/msp/users

sudo cp  ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer0.hktfp.com/msp/admincerts/hktfp-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/HktfpMSP/msp/admincerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer0.hktfp.com/assets/ca/hktfp-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/HktfpMSP/msp/cacerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer0.hktfp.com/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/HktfpMSP/msp/tlscacerts

# etc
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/EtcMSP/msp/admincerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/EtcMSP/msp/cacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/EtcMSP/msp/tlscacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/EtcMSP/msp/users

sudo cp  ${_CRYPTO_CONFIG_DIR}/EtcMSP/peer0.etradeconnect.net/msp/admincerts/etradeconnect-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/EtcMSP/msp/admincerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/EtcMSP/peer0.etradeconnect.net/assets/ca/etradeconnect-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/EtcMSP/msp/cacerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/EtcMSP/peer0.etradeconnect.net/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/EtcMSP/msp/tlscacerts

# pbctfp
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/msp/admincerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/msp/cacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/msp/tlscacerts
sudo mkdir -p ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/msp/users

sudo cp  ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/peer0.pbctfp.net/msp/admincerts/pbctfp-admin-cert.pem  ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/msp/admincerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/peer0.pbctfp.net/assets/ca/pbctfp-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/msp/cacerts
sudo cp  ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/peer0.pbctfp.net/assets/tls-ca/tls-ca-cert.pem  ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/msp/tlscacerts

# Ubuntu requires ownership of orderer certs
sudo chown -R $(whoami) ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer0.hktfp.com
sudo chown -R $(whoami) ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer1.hktfp.com
sudo chown -R $(whoami) ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer2.hktfp.com
sudo chown -R $(whoami) ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer3.hktfp.com
sudo chown -R $(whoami) ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer4.hktfp.com

cd ${_FABRIC_DIR};
export FABRIC_CFG_PATH=${PWD}
${_BIN_DIR}/configtxgen -profile OrgsOrdererGenesis -outputBlock genesis.block -channelID ordererchannel
${_BIN_DIR}/configtxgen -profile OrgsChannel -outputCreateChannelTx channel.tx -channelID loanapp

sudo cp genesis.block    ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer0.hktfp.com
sudo cp genesis.block    ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer1.hktfp.com
sudo cp genesis.block    ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer2.hktfp.com
sudo cp genesis.block    ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer3.hktfp.com
sudo cp genesis.block    ${_CRYPTO_CONFIG_DIR}/HktfpMSP/orderer4.hktfp.com
sudo mv channel.tx       ${_CRYPTO_CONFIG_DIR}/EtcMSP/peer0.etradeconnect.net/assets

# Update Anchor peer
${_BIN_DIR}/configtxgen -profile OrgsChannel -outputAnchorPeersUpdate etcAnchors.tx -channelID loanapp -asOrg etc
mkdir -p ${_CRYPTO_CONFIG_DIR}/EtcMSP/peer0.etradeconnect.net/assets
sudo mv etcAnchors.tx ${_CRYPTO_CONFIG_DIR}/EtcMSP/peer0.etradeconnect.net/assets
${_BIN_DIR}/configtxgen -profile OrgsChannel -outputAnchorPeersUpdate pbctfpAnchors.tx -channelID loanapp -asOrg pbctfp
mkdir -p ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/peer0.pbctfp.net/assets
sudo mv pbctfpAnchors.tx ${_CRYPTO_CONFIG_DIR}/PbctfpMSP/peer0.pbctfp.net/assets
