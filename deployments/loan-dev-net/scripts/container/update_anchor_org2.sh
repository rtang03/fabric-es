export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org2MSP/admin/msp
export CORE_PEER_ADDRESS=peer0.org2.example.com:8051

# Update anchor peer
peer channel update -c loanapp -f /var/artifacts/crypto-config/Org2MSP/peer0.org2.example.com/assets/Org2MSPAnchors.tx \
    -o orderer0.example.com:7050 \
    --tls --cafile /var/artifacts/crypto-config/Org2MSP/peer0.org2.example.com/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

