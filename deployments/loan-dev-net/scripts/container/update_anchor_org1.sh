export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp
export CORE_PEER_ADDRESS=peer0.org1.example.com:7051

# Update anchor peer
peer channel update -c loanapp -f /var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com/assets/Org1MSPAnchors.tx \
    -o orderer0.example.com:7050 \
    --tls --cafile /var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

