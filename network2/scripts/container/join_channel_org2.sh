cp /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/loanapp.block /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/assets

mkdir -p /var/artifacts/crypto-config/PbctfpMSP/admin/msp/admincerts
cp /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/msp/admincerts/pbctfp.net-admin-cert.pem /var/artifacts/crypto-config/PbctfpMSP/admin/msp/admincerts

export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/PbctfpMSP/admin/msp

# peer0 joining the channel
export CORE_PEER_ADDRESS=peer0.pbctfp.net:7251
peer channel join -b /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/assets/loanapp.block
peer channel getinfo -c loanapp

# peer1 joining the channel
export CORE_PEER_ADDRESS=peer1.pbctfp.net:7351
peer channel join -b /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/assets/loanapp.block
peer channel getinfo -c loanapp

# Update anchor peer
peer channel update -c loanapp -f /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/assets/pbctfpAnchors.tx \
    -o orderer0.hktfp.com:7050 \
    --tls --cafile /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

