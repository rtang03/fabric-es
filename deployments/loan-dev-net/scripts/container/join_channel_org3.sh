cp /tmp/hyperledger/Org1MSP/peer0.org1.example.com/assets/eventstore.block /tmp/hyperledger/Org3MSP/peer0.org3.neworg.com/assets

mkdir -p /tmp/hyperledger/Org3MSP/admin/msp/admincerts
cp /tmp/hyperledger/Org3MSP/peer0.org3.neworg.com/msp/admincerts/org3.neworg.com-admin-cert.pem /tmp/hyperledger/Org3MSP/admin/msp/admincerts

export CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/Org3MSP/admin/msp

# peer0 joining the channel
export CORE_PEER_ADDRESS=peer0.org3.neworg.com:11051
peer channel join -b /tmp/hyperledger/Org3MSP/peer0.org3.neworg.com/assets/eventstore.block
peer channel getinfo -c eventstore

# peer1 joining the channel
export CORE_PEER_ADDRESS=peer1.org3.neworg.com:12051
peer channel join -b /tmp/hyperledger/Org3MSP/peer0.org3.neworg.com/assets/eventstore.block
peer channel getinfo -c eventstore

# Update anchor peer
peer channel update -c eventstore -f /tmp/hyperledger/Org3MSP/peer0.org3.neworg.com/assets/Org3MSPAnchors.tx \
    -o orderer1.example.com:7050 \
    --tls --cafile /tmp/hyperledger/Org3MSP/peer0.org3.neworg.com/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

