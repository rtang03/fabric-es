cp /var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com/assets/loanapp.block /var/artifacts/crypto-config/Org3MSP/peer0.org3.example.com/assets

mkdir -p /var/artifacts/crypto-config/Org3MSP/admin/msp/admincerts
cp /var/artifacts/crypto-config/Org3MSP/peer0.org3.example.com/msp/admincerts/org3.example.com-admin-cert.pem /var/artifacts/crypto-config/Org3MSP/admin/msp/admincerts

export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org3MSP/admin/msp

# peer0 joining the channel
export CORE_PEER_ADDRESS=peer0.org3.example.com:9051
peer channel join -b /var/artifacts/crypto-config/Org3MSP/peer0.org3.example.com/assets/loanapp.block
peer channel getinfo -c loanapp

