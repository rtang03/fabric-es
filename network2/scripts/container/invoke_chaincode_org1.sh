
export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/org1/admin/msp
export CORE_PEER_ADDRESS=peer1-org1:7051
export ORDERER_URL=orderer1-org0:7050
export CHANNEL=mychannel
export CA_FILE=/var/artifacts/crypto-config/org1/peer1/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

# Invoke event store
peer chaincode invoke -o ${ORDERER_URL} -C ${CHANNEL} -n eventstore --waitForEvent \
    -c '{"Args":["createCommit", "dev_entity", "ent_dev_1001", "0","[{\"type\":\"mon\"}]"]}' \
    --tls --cafile ${CA_FILE}

# Query event store
peer chaincode invoke -o ${ORDERER_URL} -C ${CHANNEL} -n eventstore --waitForEvent \
    -c '{"Args":["eventstore:queryByEntityName","dev_entity"]}' \
    --tls --cafile ${CA_FILE}

# Invoke private data
export COMMIT=$(echo -n "{\"eventString\":\"[]\"}" | base64 | tr -d \\n)
peer chaincode invoke -o ${ORDERER_URL} -C ${CHANNEL} -n privatedata --waitForEvent \
    -c '{"Args":["privatedata:createCommit","org1PrivateDetails","private_entityName","private_1001","0"]}' \
    --transient "{\"eventstr\":\"$COMMIT\"}" \
    --tls --cafile ${CA_FILE}

# Query private data
peer chaincode invoke -o ${ORDERER_URL} -C ${CHANNEL} -n privatedata --waitForEvent \
    -c '{"Args":["privatedata:queryByEntityName","org1PrivateDetails","private_entityName"]}' \
    --tls --cafile ${CA_FILE}
