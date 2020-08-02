#!/bin/bash

######## 1. Get the name of the pod running rca:
export POD_CLI0=$(kubectl get pods -n n0 -l "app=orgadmin,release=admin0" -o jsonpath="{.items[0].metadata.name}")

######## 2. Upgrade the chart, so that the secret "org1.net-ca-cert.pem" is updated
helm upgrade admin0 -f values.0.yaml . -n n0

######## 3. Create genesis.block / channel.tx
kubectl -n n0 exec -it $POD_CLI0 -- configtxgen -profile OrgsOrdererGenesis -outputBlock /var/hyperledger/crypto-config/genesis.block -channelID ordererchannel
kubectl -n n0 exec -it $POD_CLI0 -- configtxgen -profile OrgsChannel -outputCreateChannelTx /var/hyperledger/crypto-config/channel.tx -channelID loanapp

######## 4. Create configmap: genesis.block
kubectl -n n0 exec $POD_CLI0 -- cat ../crypto-config/genesis.block > genesis.block
kubectl -n n0 create secret generic genesis --from-file=genesis=./genesis.block
rm genesis.block
