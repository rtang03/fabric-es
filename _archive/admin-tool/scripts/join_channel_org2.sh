cp /tmp/hyperledger/org1.example.com/peer0/assets/eventstore.block /tmp/hyperledger/org2.example.com/peer0/assets

mkdir -p /tmp/hyperledger/org2.example.com/admin/msp/admincerts
cp /tmp/hyperledger/org2.example.com/peer0/msp/admincerts/org2.example.com-admin-cert.pem /tmp/hyperledger/org2.example.com/admin/msp/admincerts

export CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org2.example.com/admin/msp

# peer0 joining the channel
export CORE_PEER_ADDRESS=peer0.org2.example.com:9051
peer channel join -b /tmp/hyperledger/org2.example.com/peer0/assets/eventstore.block
peer channel getinfo -c eventstore

# peer1 joining the channel
export CORE_PEER_ADDRESS=peer1.org2.example.com:10051
peer channel join -b /tmp/hyperledger/org2.example.com/peer0/assets/eventstore.block
peer channel getinfo -c eventstore

