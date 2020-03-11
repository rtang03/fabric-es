cp /tmp/hyperledger/org1.example.com/peer0/assets/eventstore.block /tmp/hyperledger/org3.neworg.com/peer0/assets

mkdir -p /tmp/hyperledger/org3.neworg.com/admin/msp/admincerts
cp /tmp/hyperledger/org3.neworg.com/peer0/msp/admincerts/org3.neworg.com-admin-cert.pem /tmp/hyperledger/org3.neworg.com/admin/msp/admincerts

export CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org3.neworg.com/admin/msp

# peer0 joining the channel
export CORE_PEER_ADDRESS=peer0.org3.neworg.com:11051
peer channel join -b /tmp/hyperledger/org3.neworg.com/peer0/assets/eventstore.block
peer channel getinfo -c eventstore

# peer1 joining the channel
export CORE_PEER_ADDRESS=peer1.org3.neworg.com:12051
peer channel join -b /tmp/hyperledger/org3.neworg.com/peer0/assets/eventstore.block
peer channel getinfo -c eventstore

