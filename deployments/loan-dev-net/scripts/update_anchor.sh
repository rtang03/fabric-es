# Import common.sh
. `pwd`/common.sh

cd ${_FABRIC_DIR}; 
export FABRIC_CFG_PATH=${PWD}

# Update Anchor peer
${_BIN_DIR}/configtxgen -profile OrgsChannel -outputAnchorPeersUpdate Org1MSPAnchors.tx -channelID loanapp -asOrg Org1MSP
mkdir -p ${_CRYPTO_CONFIG_DIR}/Org1MSP/peer0.org1.example.com/assets
mv Org1MSPAnchors.tx ${_CRYPTO_CONFIG_DIR}/Org1MSP/peer0.org1.example.com/assets
${_BIN_DIR}/configtxgen -profile OrgsChannel -outputAnchorPeersUpdate Org2MSPAnchors.tx -channelID loanapp -asOrg Org2MSP
mkdir -p ${_CRYPTO_CONFIG_DIR}/Org2MSP/peer0.org2.example.com/assets
mv Org2MSPAnchors.tx ${_CRYPTO_CONFIG_DIR}/Org2MSP/peer0.org2.example.com/assets
${_BIN_DIR}/configtxgen -profile OrgsChannel -outputAnchorPeersUpdate Org3MSPAnchors.tx -channelID loanapp -asOrg Org3MSP
mkdir -p ${_CRYPTO_CONFIG_DIR}/Org3MSP/peer0.org3.example.com/assets
mv Org3MSPAnchors.tx ${_CRYPTO_CONFIG_DIR}/Org3MSP/peer0.org3.example.com/assets

sleep 2

docker exec cli.org1.example.com sh -c "/setup/update_anchor_org1.sh"
docker exec cli.org2.example.com sh -c "/setup/update_anchor_org2.sh"
docker exec cli.org3.example.com sh -c "/setup/update_anchor_org3.sh"
