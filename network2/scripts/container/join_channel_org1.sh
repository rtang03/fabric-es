mkdir -p /var/artifacts/crypto-config/org1/admin/msp/admincerts
cp /var/artifacts/crypto-config/org1/peer1/msp/admincerts/org1-admin-cert.pem /var/artifacts/crypto-config/org1/admin/msp/admincerts

export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/org1/admin/msp
peer channel create -c mychannel -f /var/artifacts/crypto-config/org1/peer1/assets/channel.tx -o orderer1-org0:7050 \
    --outputBlock /var/artifacts/crypto-config/org1/peer1/assets/mychannel.block \
    --tls --cafile /var/artifacts/crypto-config/org1/peer1/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/org1/admin/msp

# peer1 joining the channel
export CORE_PEER_ADDRESS=peer1-org1:7051
peer channel join -b /var/artifacts/crypto-config/org1/peer1/assets/mychannel.block
peer channel getinfo -c mychannel

# peer2 joining the channel
export CORE_PEER_ADDRESS=peer2-org1:7051
peer channel join -b /var/artifacts/crypto-config/org1/peer1/assets/mychannel.block
peer channel getinfo -c mychannel

