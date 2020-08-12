#!/bin/bash
. ./scripts/setup.sh

kubectl -n n1 exec -it $POD_CLI1 -- sh -c "set -x; peer channel fetch config ./channel-artifacts/config_block.pb \
-o o0-hlf-ord.n0.svc.cluster.local:7050 \
--ordererTLSHostnameOverride o0-hlf-ord \
-c loanapp --tls --cafile /var/hyperledger/crypto-config/Org1MSP/peer0.org1.net/ord/org0/tlscacerts/tlscacert.pem"
printMessage "fetch block" $?

kubectl -n n1 exec -it $POD_CLI1 -- sh -c "set -x; configtxlator proto_decode --input ./channel-artifacts/config_block.pb --type common.Block --output ./channel-artifacts/config_block.json"
printMessage "decode block0" $?

kubectl -n n1 exec -it $POD_CLI1 -- sh -c "set -x; jq .data.data[0].payload.data.config ./channel-artifacts/config_block.json > ./channel-artifacts/config.json"
printMessage "jq extract channel" $?

kubectl -n n1 exec -it $POD_CLI1 -- sh -c "set -x; cp ./channel-artifacts/config.json ./channel-artifacts/config_copy.json"
printMessage "cp block" $?

kubectl -n n1 exec -it $POD_CLI1 -- sh -c "set -x; jq '.channel_group.groups.Application.groups.Org1MSP.values += {\"AnchorPeers\":{\"mod_policy\":\"Admins\",\"value\":{\"anchor_peers\":[{\"host\":\"p0o1-hlf-peer\",\"port\":7051}]},\"version\":\"0\"}}' ./channel-artifacts/config_copy.json > ./channel-artifacts/modified_config.json"
printMessage "jq add anchorpeer" $?

kubectl -n n1 exec -it $POD_CLI1 -- sh -c "set -x; configtxlator proto_encode --input ./channel-artifacts/config.json --type common.Config --output ./channel-artifacts/config.pb"
printMessage "encode current block" $?

kubectl -n n1 exec -it $POD_CLI1 -- sh -c "set -x; configtxlator proto_encode --input ./channel-artifacts/modified_config.json --type common.Config --output ./channel-artifacts/modified_config.pb"
printMessage "encode new block" $?

kubectl -n n1 exec -it $POD_CLI1 -- sh -c "set -x; configtxlator compute_update --channel_id loanapp --original ./channel-artifacts/config.pb --updated ./channel-artifacts/modified_config.pb --output ./channel-artifacts/config_update.pb"
printMessage "compute update block" $?

kubectl -n n1 exec -it $POD_CLI1 -- sh -c "set -x; configtxlator proto_decode --input ./channel-artifacts/config_update.pb --type common.ConfigUpdate --output ./channel-artifacts/config_update.json"
printMessage "decode update block" $?

kubectl -n n1 exec -it $POD_CLI1 -- sh -c "echo '{\"payload\":{\"header\":{\"channel_header\":{\"channel_id\":\"loanapp\", \"type\":2}},\"data\":{\"config_update\":'\$(cat ./channel-artifacts/config_update.json)'}}}' | jq . > ./channel-artifacts/config_update_in_envelope.json"
printMessage "create update_envelope" $?

kubectl -n n1 exec -it $POD_CLI1 -- sh -c "set -x; configtxlator proto_encode --input ./channel-artifacts/config_update_in_envelope.json --type common.Envelope --output ./channel-artifacts/config_update_in_envelope.pb"
printMessage "encode update_envelope" $?

kubectl -n n1 exec -it $POD_CLI1 -- sh -c "set -x; peer channel update -f ./channel-artifacts/config_update_in_envelope.pb \
-o o0-hlf-ord.n0.svc.cluster.local:7050 \
--ordererTLSHostnameOverride o0-hlf-ord \
-c loanapp --tls --cafile /var/hyperledger/crypto-config/Org1MSP/peer0.org1.net/ord/org0/tlscacerts/tlscacert.pem"
printMessage "send update_envelope proposal" $?
