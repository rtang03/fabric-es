
export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp
export CORE_PEER_ADDRESS=peer0.etradeconnect.net:7051
export ORDERER_URL=orderer0.hktfp.com:7050
export CHANNEL=loanapp
export CA_FILE=/var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

# Invoke event store
peer chaincode invoke -o ${ORDERER_URL} -C ${CHANNEL} -n eventstore --waitForEvent \
    -c '{"Args":["createCommit", "dev_entity", "ent_dev_1001", "0","[{\"type\":\"mon\"}]", "ent_dev_1001"]}' \
    --tls --cafile ${CA_FILE}

# Query event store
peer chaincode invoke -o ${ORDERER_URL} -C ${CHANNEL} -n eventstore --waitForEvent \
    -c '{"Args":["eventstore:queryByEntityName","dev_entity"]}' \
    --tls --cafile ${CA_FILE}

# Invoke private data
export COMMIT=$(echo -n "{\"eventString\":\"[]\"}" | base64 | tr -d \\n)
peer chaincode invoke -o ${ORDERER_URL} -C ${CHANNEL} -n privatedata --waitForEvent \
    -c '{"Args":["privatedata:createCommit","etcPrivateDetails","private_entityName","private_1001","0","private_1001"]}' \
    --transient "{\"eventstr\":\"$COMMIT\"}" \
    --tls --cafile ${CA_FILE}

# Query private data
peer chaincode invoke -o ${ORDERER_URL} -C ${CHANNEL} -n privatedata --waitForEvent \
    -c '{"Args":["privatedata:queryByEntityName","etcPrivateDetails","private_entityName"]}' \
    --tls --cafile ${CA_FILE}
