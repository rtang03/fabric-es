mkdir -p /tmp/hyperledger/org1.example.com/admin/msp/admincerts
cp /tmp/hyperledger/org1.example.com/peer0/msp/admincerts/org1.example.com-admin-cert.pem /tmp/hyperledger/org1.example.com/admin/msp/admincerts

export CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org1.example.com/admin/msp
peer channel create -c eventstore -f /tmp/hyperledger/org1.example.com/peer0/assets/channel.tx -o orderer1.example.com:7050 \
    --outputBlock /tmp/hyperledger/org1.example.com/peer0/assets/eventstore.block \
    --tls --cafile /tmp/hyperledger/org1.example.com/peer0/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

export CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org1.example.com/admin/msp

# peer0 joining the channel
export CORE_PEER_ADDRESS=peer0.org1.example.com:7051
peer channel join -b /tmp/hyperledger/org1.example.com/peer0/assets/eventstore.block
peer channel getinfo -c eventstore

# peer1 joining the channel
export CORE_PEER_ADDRESS=peer1.org1.example.com:7051
peer channel join -b /tmp/hyperledger/org1.example.com/peer0/assets/eventstore.block
peer channel getinfo -c eventstore

