cp /var/artifacts/crypto-config/org1/peer1/assets/mychannel.block /var/artifacts/crypto-config/org2/peer1/assets

mkdir -p /var/artifacts/crypto-config/org2/admin/msp/admincerts
cp /var/artifacts/crypto-config/org2/peer1/msp/admincerts/org2-admin-cert.pem /var/artifacts/crypto-config/org2/admin/msp/admincerts

export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/org2/admin/msp

# peer1 joining the channel
export CORE_PEER_ADDRESS=peer1-org2:7051
peer channel join -b /var/artifacts/crypto-config/org2/peer1/assets/mychannel.block
peer channel getinfo -c mychannel

# peer2 joining the channel
export CORE_PEER_ADDRESS=peer2-org2:7051
peer channel join -b /var/artifacts/crypto-config/org2/peer1/assets/mychannel.block
peer channel getinfo -c mychannel

