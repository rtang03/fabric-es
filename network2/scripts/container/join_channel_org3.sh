cp /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/loanapp.block /var/artifacts/crypto-config/HsbcMSP/peer0.hsbc.com.hk/assets

mkdir -p /var/artifacts/crypto-config/HsbcMSP/admin/msp/admincerts
cp /var/artifacts/crypto-config/HsbcMSP/peer0.hsbc.com.hk/msp/admincerts/hsbc.com.hk-admin-cert.pem /var/artifacts/crypto-config/HsbcMSP/admin/msp/admincerts

export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/HsbcMSP/admin/msp

# peer0 joining the channel
export CORE_PEER_ADDRESS=peer0.hsbc.com.hk:7451
peer channel join -b /var/artifacts/crypto-config/HsbcMSP/peer0.hsbc.com.hk/assets/loanapp.block
peer channel getinfo -c loanapp

# peer1 joining the channel
export CORE_PEER_ADDRESS=peer1.hsbc.com.hk:7551
peer channel join -b /var/artifacts/crypto-config/HsbcMSP/peer0.hsbc.com.hk/assets/loanapp.block
peer channel getinfo -c loanapp

# Update anchor peer
peer channel update -c loanapp -f /var/artifacts/crypto-config/HsbcMSP/peer0.hsbc.com.hk/assets/hsbcAnchors.tx \
    -o orderer0.hktfp.com:7050 \
    --tls --cafile /var/artifacts/crypto-config/HsbcMSP/peer0.hsbc.com.hk/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

