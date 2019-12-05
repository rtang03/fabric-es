
export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/org1/admin/msp
export CORE_PEER_ADDRESS=peer1-org1:7051

peer chaincode instantiate -o orderer1-org0:7050 -C mychannel -n eventstore -v 1.0 -l node \
    -c '{"Args":["eventstore:instantiate"]}' -P "OR ('org1MSP.member', 'org2MSP.member')" \
    --tls --cafile /var/artifacts/crypto-config/org1/peer1/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

sleep 5

peer chaincode instantiate -o orderer1-org0:7050 -C mychannel -n privatedata -v 1.0 -l node \
    -c '{"Args":["privatedata:instantiate"]}' -P "OR ('org1MSP.member', 'org2MSP.member')" \
    --collections-config /opt/gopath/src/github.com/hyperledger/fabric/chaincode/collections.json \
    --tls --cafile /var/artifacts/crypto-config/org1/peer1/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

