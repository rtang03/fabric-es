members="'Org1MSP.member' ,'Org2MSP.member' ,'Org3MSP.member' ,"
members_trimmed=$(echo ${members} |sed 's/,$//')

export CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/Org1MSP/admin/msp
export CORE_PEER_ADDRESS=peer0.org1.example.com:7051

peer chaincode instantiate -o orderer1.example.com:7050 -C eventstore -n eventstore -v 1.0 -l node \
    -c '{"Args":["eventstore:instantiate"]}' -P "OR (${members_trimmed})" \
    --tls --cafile /tmp/hyperledger/Org1MSP/peer0.org1.example.com/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

sleep 5

peer chaincode instantiate -o orderer1.example.com:7050 -C eventstore -n privatedata -v 1.0 -l node \
    -c '{"Args":["privatedata:instantiate"]}' -P "OR (${members_trimmed})" \
    --collections-config /opt/gopath/src/github.com/hyperledger/fabric/chaincode/op/collections.json \
    --tls --cafile /tmp/hyperledger/Org1MSP/peer0.org1.example.com/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
