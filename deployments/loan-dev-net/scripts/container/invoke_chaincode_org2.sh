export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org2MSP/admin/msp
export CORE_PEER_ADDRESS=peer0.org2.example.com:8051
export ORDERER_URL=orderer0.example.com:7050
export CHANNEL=loanapp
export CA_FILE=/var/artifacts/crypto-config/Org2MSP/peer0.org2.example.com/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

# Invoke event store
peer chaincode invoke -o ${ORDERER_URL} -C ${CHANNEL} -n eventstore --waitForEvent \
    -c '{"Args":["createCommit", "dev_entity", "ent_dev_org2", "0","[{\"type\":\"mon\"}]", "ent_dev_org2"]}' \
    --tls --cafile ${CA_FILE}

# Query event store
peer chaincode invoke -o ${ORDERER_URL} -C ${CHANNEL} -n eventstore --waitForEvent \
    -c '{"Args":["eventstore:queryByEntityName","dev_entity"]}' \
    --tls --cafile ${CA_FILE}

# Invoke private data
export COMMIT=$(echo -n "{\"eventString\":\"[]\"}" | base64 | tr -d \\n)
peer chaincode invoke -o ${ORDERER_URL} -C ${CHANNEL} -n privatedata --waitForEvent \
    -c '{"Args":["privatedata:createCommit","Org2MSPPrivateDetails","private_entityName","private_org2","0","private_org2"]}' \
    --transient "{\"eventstr\":\"$COMMIT\"}" \
    --tls --cafile ${CA_FILE}

# Query private data
peer chaincode invoke -o ${ORDERER_URL} -C ${CHANNEL} -n privatedata --waitForEvent \
    -c '{"Args":["privatedata:queryByEntityName","Org2MSPPrivateDetails","private_entityName"]}' \
    --tls --cafile ${CA_FILE}
