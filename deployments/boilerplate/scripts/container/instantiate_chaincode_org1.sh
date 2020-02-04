members="'EtcMSP.member' ,'PbctfpMSP.member' ,'HsbcMSP.member' ,"
members_trimmed=$(echo ${members} |sed 's/,$//')

export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp
export CORE_PEER_ADDRESS=peer0.etradeconnect.net:7051

peer chaincode instantiate -o orderer0.hktfp.com:7050 -C loanapp -n eventstore -v 1.0 -l node \
    -c '{"Args":["eventstore:instantiate"]}' -P "OR (${members_trimmed})" \
    --tls --cafile /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

sleep 5

peer chaincode instantiate -o orderer0.hktfp.com:7050 -C loanapp -n privatedata -v 1.0 -l node \
    -c '{"Args":["privatedata:instantiate"]}' -P "OR (${members_trimmed})" \
    --collections-config /opt/gopath/src/github.com/hyperledger/fabric/chaincode/collections.json \
    --tls --cafile /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem
