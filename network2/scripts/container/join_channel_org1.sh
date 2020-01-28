mkdir -p /var/artifacts/crypto-config/EtcMSP/admin/msp/admincerts
cp /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/msp/admincerts/etradeconnect.net-admin-cert.pem /var/artifacts/crypto-config/EtcMSP/admin/msp/admincerts

export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp
peer channel create -c loanapp -f /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/channel.tx -o orderer0.hktfp.com:7050 \
    --outputBlock /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/loanapp.block \
    --tls --cafile /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp

# peer0 joining the channel
export CORE_PEER_ADDRESS=peer0.etradeconnect.net:7051
peer channel join -b /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/loanapp.block
peer channel getinfo -c loanapp

# peer1 joining the channel
export CORE_PEER_ADDRESS=peer1.etradeconnect.net:7151
peer channel join -b /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/loanapp.block
peer channel getinfo -c loanapp

