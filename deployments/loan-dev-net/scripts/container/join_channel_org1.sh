mkdir -p /var/artifacts/crypto-config/Org1MSP/admin/msp/admincerts
cp /var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com/msp/admincerts/org1.example.com-admin-cert.pem /var/artifacts/crypto-config/Org1MSP/admin/msp/admincerts

export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp
peer channel create -c loanapp -f /var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com/assets/channel.tx -o orderer0.example.com:7050 \
    --outputBlock /var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com/assets/loanapp.block \
    --tls --cafile /var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp

# peer0 joining the channel
export CORE_PEER_ADDRESS=peer0.org1.example.com:7051
peer channel join -b /var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com/assets/loanapp.block
peer channel getinfo -c loanapp

