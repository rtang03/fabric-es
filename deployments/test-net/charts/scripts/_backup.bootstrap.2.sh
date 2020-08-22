#!/bin/bash
. ./scripts/setup.sh

## AFTER ORDERER ip address is updated

helm install p0o1 -n n1 ./hlf-peer

sleep 60

export POD_CLI1=$(kubectl get pods --namespace n1 -l "app=orgadmin,release=admin1" -o jsonpath="{.items[0].metadata.name}")
preventEmptyValue "pod unavailable" $POD_CLI1

# create channel
kubectl -n n1 exec -it $POD_CLI1 -- sh -c "set -x; peer channel create -c loanapp -f /var/hyperledger/crypto-config/Org1MSP/channeltx/channel.tx \
 -o o0-hlf-ord.n0.svc.cluster.local:7050 \
 --outputBlock /var/hyperledger/crypto-config/Org1MSP/peer0.org1.net/loanapp.block --tls \
 --cafile /var/hyperledger/crypto-config/Org1MSP/peer0.org1.net/ord/tls-msp/signcerts/cert.pem \
 --ordererTLSHostnameOverride o0-hlf-ord"
printMessage "create channel" $?

sleep 5

# join channel
kubectl -n n1 exec -it $POD_CLI1 -- sh -c "set -x; peer channel join -b /var/hyperledger/crypto-config/Org1MSP/peer0.org1.net/loanapp.block"
printMessage "join channel" $?

./update-anchor-peers.sh

# build chaincode
pushd .
cd ../../../packages/chaincode
yarn build
printMessage "Build chaincode" $?
popd
rm -r ./chaincode
printMessage "remove chaincode directory" $?
sleep 1
mkdir -p ./chaincode
printMessage "create chaincode directory" $?
sleep 1
cp ../../../packages/chaincode/package.json ./chaincode
printMessage "copy package.json" $?
sleep 1
cp -R ../../../packages/chaincode/dist ./chaincode
printMessage "copy dist" $?
sleep 1

# package chaincode
kubectl -n n1 cp chaincode $POD_CLI1:channel-artifacts
printMessage "copy chaincode dist to k8s" $?

sleep 1

kubectl -n n1 exec -it $POD_CLI1 -- sh -c "set -x; peer lifecycle chaincode package ./channel-artifacts/eventstore.tar.gz \
--path ./channel-artifacts/chaincode --lang node --label eventstorev1"
printMessage "package chaincode" $?

# install chaincode
kubectl -n n1 exec -it $POD_CLI1 -- sh -c "set -x; peer lifecycle chaincode install ./channel-artifacts/eventstore.tar.gz"
printMessage "install chaincode" $?

sleep 1

# query package id
kubectl -n n1 exec -it $POD_CLI1 -- sh -c "set -x; peer lifecycle chaincode queryinstalled >& channel-artifacts/installedcc.txt"
printMessage "query package id" $?

sleep 1

# approve chaincode
kubectl -n n1 exec -it $POD_CLI1 -- sh -c "set -x; peer lifecycle chaincode approveformyorg \
-o o0-hlf-ord.n0.svc.cluster.local:7050 \
--ordererTLSHostnameOverride o0-hlf-ord \
-C loanapp --tls --cafile /var/hyperledger/crypto-config/Org1MSP/peer0.org1.net/ord/tls-msp/signcerts/cert.pem \
--name eventstore \
--version 1.0 \
--package-id \$(sed -n \"/eventstorev1/{s/^Package ID: //; s/, Label:.*$//; p;}\" channel-artifacts/installedcc.txt) \
--init-required \
--sequence 1 \
--waitForEvent >& channel-artifacts/approvecc.txt"
printMessage "approve chaincode" $?

sleep 1

kubectl -n n1 exec -it $POD_CLI1 -- sh -c "peer lifecycle chaincode queryapproved -C loanapp -n eventstore"
printMessage "query approved chaincode" $?

# check commit readiness
kubectl -n n1 exec -it $POD_CLI1 -- sh -c "set -x; peer lifecycle chaincode checkcommitreadiness \
-o o0-hlf-ord.n0.svc.cluster.local:7050 \
--ordererTLSHostnameOverride o0-hlf-ord \
-C loanapp --tls --cafile /var/hyperledger/crypto-config/Org1MSP/peer0.org1.net/ord/tls-msp/signcerts/cert.pem \
--name eventstore \
--version 1.0 \
--init-required \
--sequence 1 >& channel-artifacts/checkcommitreadiness.txt"
printMessage "check commit readiness" $?

sleep 1

# commit chaincode
kubectl -n n1 exec -it $POD_CLI1 -- sh -c "set -x; peer lifecycle chaincode commit \
-o o0-hlf-ord.n0.svc.cluster.local:7050 \
--ordererTLSHostnameOverride o0-hlf-ord \
-C loanapp --tls --cafile /var/hyperledger/crypto-config/Org1MSP/peer0.org1.net/ord/tls-msp/signcerts/cert.pem \
--name eventstore \
--version 1.0 \
--init-required \
--sequence 1 \
--waitForEvent \
--peerAddresses p0o1-hlf-peer:7051 \
--tlsRootCertFiles /var/hyperledger/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem >& channel-artifacts/commitcc.txt"
printMessage "commit chaincode" $?

# query commited chaincode
kubectl -n n1 exec -it $POD_CLI1 -- sh -c "peer lifecycle chaincode querycommitted -C loanapp \
-o o0-hlf-ord.n0.svc.cluster.local:7050 \
--ordererTLSHostnameOverride o0-hlf-ord \
-C loanapp --name eventstore \
--tls --cafile /var/hyperledger/crypto-config/Org1MSP/peer0.org1.net/ord/tls-msp/signcerts/cert.pem \
--peerAddresses p0o1-hlf-peer:7051 \
--tlsRootCertFiles /var/hyperledger/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem"
printMessage "query committed chaincode" $?

sleep 1

# init chaincode
kubectl -n n1 exec -it $POD_CLI1 -- sh -c "set -x; peer chaincode invoke --isInit \
-o o0-hlf-ord.n0.svc.cluster.local:7050 \
-C loanapp \
--name eventstore \
-c '{\"function\":\"eventstore:Init\",\"Args\":[]}' \
--tls --cafile /var/hyperledger/crypto-config/Org1MSP/peer0.org1.net/ord/tls-msp/signcerts/cert.pem \
--ordererTLSHostnameOverride o0-hlf-ord \
--peerAddresses p0o1-hlf-peer:7051 \
--tlsRootCertFiles /var/hyperledger/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem \
--waitForEvent"
printMessage "init chaincode" $?


