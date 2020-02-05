mkdir -p /tmp/hyperledger/Org1MSP/admin/msp/admincerts
cp /tmp/hyperledger/Org1MSP/peer0.org1.example.com/msp/admincerts/org1.example.com-admin-cert.pem /tmp/hyperledger/Org1MSP/admin/msp/admincerts

export CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/Org1MSP/admin/msp
peer channel create -c eventstore -f /tmp/hyperledger/Org1MSP/peer0.org1.example.com/assets/channel.tx -o orderer1.example.com:7050 \
    --outputBlock /tmp/hyperledger/Org1MSP/peer0.org1.example.com/assets/eventstore.block \
    --tls --cafile /tmp/hyperledger/Org1MSP/peer0.org1.example.com/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

export CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/Org1MSP/admin/msp

# peer0 joining the channel
export CORE_PEER_ADDRESS=peer0.org1.example.com:7051
peer channel join -b /tmp/hyperledger/Org1MSP/peer0.org1.example.com/assets/eventstore.block
peer channel getinfo -c eventstore

# peer1 joining the channel
export CORE_PEER_ADDRESS=peer1.org1.example.com:8051
peer channel join -b /tmp/hyperledger/Org1MSP/peer0.org1.example.com/assets/eventstore.block
peer channel getinfo -c eventstore

# Update anchor peer
peer channel update -c eventstore -f /tmp/hyperledger/Org1MSP/peer0.org1.example.com/assets/Org1MSPAnchors.tx \
    -o orderer1.example.com:7050 \
    --tls --cafile /tmp/hyperledger/Org1MSP/peer0.org1.example.com/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

