#!/bin/bash
. ./scripts/setup.sh
######## post-install notes for admin0/orgadmin
######## Objective: These steps create geneis.block, and secret "genesis" and "channel.tx"

######## IMPORTANT ########
## Below steps are performed ***ONLY AFTER*** all rca0, rca1, tlsca0 and tlsca1 are Done.
######## 1. Get the name of the pod running rca:
export POD_CLI0=$(kubectl get pods -n n0 -l "app=orgadmin,release=admin0" -o jsonpath="{.items[0].metadata.name}")
preventEmptyValue "pod unavailable" $POD_CLI0

######## 2. Create genesis.block / channel.tx / anchor.tx
kubectl -n n0 exec -it $POD_CLI0 -- configtxgen -configPath /var/hyperledger/cli/configtx -profile OrgsOrdererGenesis -outputBlock /var/hyperledger/crypto-config/genesis.block -channelID ordererchannel
printMessage "create genesis block" $?

kubectl -n n0 exec -it $POD_CLI0 -- configtxgen -configPath /var/hyperledger/cli/configtx -profile OrgsChannel -outputCreateChannelTx /var/hyperledger/crypto-config/channel.tx -channelID loanapp
printMessage "create channel.tx" $?

######## 3. Create configmap: genesis.block
kubectl -n n0 exec $POD_CLI0 -- cat ../crypto-config/genesis.block > genesis.block
kubectl -n n0 create secret generic genesis --from-file=genesis=./genesis.block
printMessage "create secret genesis" $?
rm genesis.block

######## 4. Create configmap: channel.tx for org1, with namespace n1
kubectl -n n0 exec $POD_CLI0 -- cat ../crypto-config/channel.tx > channel.tx
kubectl -n n1 create secret generic channeltx --from-file=channel.tx=./channel.tx
printMessage "create secret channeltx" $?
rm channel.tx
