
export CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org1.example.com/admin/msp
export CORE_PEER_ADDRESS=peer0.org1.example.com:7051

peer chaincode instantiate -o orderer1.example.com:7050 -C eventstore -n eventstore -v 1.0 -l node \
    -c '{"Args":["eventstore:instantiate"]}' -P "OR ('Org1MSP.member', 'org2MSP.member')" \
    --tls --cafile /tmp/hyperledger/org1.example.com/peer0/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

sleep 5

peer chaincode instantiate -o orderer1.example.com:7050 -C eventstore -n privatedata -v 1.0 -l node \
    -c '{"Args":["privatedata:instantiate"]}' -P "OR ('Org1MSP.member', 'org2MSP.member')" \
    --collections-config /opt/gopath/src/github.com/hyperledger/fabric/chaincode/collections.json \
    --tls --cafile /tmp/hyperledger/org1.example.com/peer0/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

