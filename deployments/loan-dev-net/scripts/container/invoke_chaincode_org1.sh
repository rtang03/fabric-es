export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp
export CORE_PEER_ADDRESS=peer0.org1.example.com:7051
export ORDERER_URL=orderer0.example.com:7050
export CHANNEL=loanapp
export CA_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

# Invoke event store
peer chaincode invoke -o ${ORDERER_URL} -C ${CHANNEL} -n eventstore --waitForEvent \
    -c '{"Args":["createCommit", "dev_entity", "ent_dev_org1", "0","[{\"type\":\"mon\"}]", "ent_dev_org1"]}' \
    --tls --cafile ${CA_FILE}

# Query event store
peer chaincode invoke -o ${ORDERER_URL} -C ${CHANNEL} -n eventstore --waitForEvent \
    -c '{"Args":["eventstore:queryByEntityName","dev_entity"]}' \
    --tls --cafile ${CA_FILE}

# Invoke private data
export COMMIT=$(echo -n "{\"eventString\":\"[]\"}" | base64 | tr -d \\n)
peer chaincode invoke -o ${ORDERER_URL} -C ${CHANNEL} -n privatedata --waitForEvent \
    -c '{"Args":["privatedata:createCommit","Org1MSPPrivateDetails","private_entityName","private_org1","0","private_org1"]}' \
    --transient "{\"eventstr\":\"$COMMIT\"}" \
    --tls --cafile ${CA_FILE}

# Query private data
peer chaincode invoke -o ${ORDERER_URL} -C ${CHANNEL} -n privatedata --waitForEvent \
    -c '{"Args":["privatedata:queryByEntityName","Org1MSPPrivateDetails","private_entityName"]}' \
    --tls --cafile ${CA_FILE}
