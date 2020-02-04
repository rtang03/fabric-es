cp /tmp/hyperledger/Org1MSP/peer0.org1.example.com/assets/eventstore.block /tmp/hyperledger/Org2MSP/peer0.org2.example.com/assets

mkdir -p /tmp/hyperledger/Org2MSP/admin/msp/admincerts
cp /tmp/hyperledger/Org2MSP/peer0.org2.example.com/msp/admincerts/org2.example.com-admin-cert.pem /tmp/hyperledger/Org2MSP/admin/msp/admincerts

export CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/Org2MSP/admin/msp

# peer0 joining the channel
export CORE_PEER_ADDRESS=peer0.org2.example.com:9051
peer channel join -b /tmp/hyperledger/Org2MSP/peer0.org2.example.com/assets/eventstore.block
peer channel getinfo -c eventstore

# peer1 joining the channel
export CORE_PEER_ADDRESS=peer1.org2.example.com:10051
peer channel join -b /tmp/hyperledger/Org2MSP/peer0.org2.example.com/assets/eventstore.block
peer channel getinfo -c eventstore

# Update anchor peer
peer channel update -c eventstore -f /tmp/hyperledger/Org2MSP/peer0.org2.example.com/assets/Org2MSPAnchors.tx \
    -o orderer1.example.com:7050 \
    --tls --cafile /tmp/hyperledger/Org2MSP/peer0.org2.example.com/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

