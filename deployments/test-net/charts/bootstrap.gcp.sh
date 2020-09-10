#!/bin/bash
. ./scripts/setup.sh

SECONDS=0

./scripts/rm-secret.n0.sh
./scripts/rm-secret.n1.sh

# Note: Manually deploy PV
#kubectl -n n0 create -f ./releases/org0/volumes/pvc-org0.gcp.yaml
#kubectl -n n0 create -f ./releases/org0/volumes/pvc-orderers.gcp.yaml
#kubectl -n n1 create -f ./releases/org1/volumes/pvc-org1.gcp.yaml
#kubectl -n n1 create -f ./releases/org1/volumes/pvc-p0o1db.gcp.yaml
#kubectl -n n1 create -f ./releases/org1/volumes/pvc-p0o1.gcp.yaml
# printMessage "create pv/pvc for org1" $?

helm install admin1 -n n1 -f ./releases/org1/admin1-orgadmin.gcp.yaml ./orgadmin
printMessage "install admin1" $?

set -x
kubectl wait --for=condition=Available --timeout 60s deployment/admin1-orgadmin-cli -n n1
res=$?
set +x
printMessage "deployment/admin1-orgadmin-cli" $res

# postgres db is deployed with statefulset; of which "--wait" does not support.
sleep 60

helm install tlsca1 -n n1 -f ./releases/org1/tlsca1-hlf-ca.gcp.yaml ./hlf-ca
printMessage "install tlsca1" $?

set -x
kubectl wait --for=condition=Available --timeout 60s deployment/tlsca1-hlf-ca -n n1
res=$?
set +x
printMessage "deployment/tlsca1-hlf-ca" $res

sleep 5

helm install rca1 -n n1 -f ./releases/org1/rca1-hlf-ca.gcp.yaml ./hlf-ca
printMessage "install rca1" $?

set -x
kubectl wait --for=condition=Available --timeout 60s deployment/rca1-hlf-ca -n n1
res=$?
set +x
printMessage "deployment/rca1-hlf-ca" $res

sleep 30

helm install crypto-tlsca1 -n n1 -f ./releases/org1/tlsca1-cryptogen.gcp.yaml ./cryptogen
printMessage "install crypto-tlsca1" $?

set -x
kubectl wait --for=condition=complete --timeout 120s job/crypto-tlsca1-cryptogen -n n1
res=$?
set +x
printMessage "job/crypto-tlsca1-cryptogen" $res

helm install crypto-rca1 -n n1 -f ./releases/org1/rca1-cryptogen.gcp.yaml ./cryptogen
printMessage "install crypto-rca1" $?

set -x
kubectl wait --for=condition=complete --timeout 120s job/crypto-rca1-cryptogen -n n1
res=$?
set +x
printMessage "job/crypto-rca1-cryptogen" $res

# Org0
helm install admin0 -n n0 -f ./releases/org0/admin0-orgadmin.gcp.yaml ./orgadmin
printMessage "install admin0" $?

sleep 60

set -x
kubectl wait --for=condition=Available --timeout 60s deployment/admin0-orgadmin-cli -n n0
res=$?
set +x
printMessage "deployment/admin0-orgadmin-cli" $res

helm install tlsca0 -n n0 -f ./releases/org0/tlsca0-hlf-ca.gcp.yaml ./hlf-ca
printMessage "install tlsca0" $?

set -x
kubectl wait --for=condition=Available --timeout 60s deployment/tlsca0-hlf-ca -n n0
res=$?
set +x
printMessage "deployment/tlsca0-hlf-ca" $res

sleep 5

helm install rca0 -n n0 -f ./releases/org0/rca0-hlf-ca.gcp.yaml ./hlf-ca
printMessage "install rca0" $?

set -x
kubectl wait --for=condition=Available --timeout 60s deployment/rca0-hlf-ca -n n0
res=$?
set +x
printMessage "deployment/rca0-hlf-ca" $res

sleep 30

helm install crypto-tlsca0 -n n0 -f ./releases/org0/tlsca0-cryptogen.gcp.yaml ./cryptogen
printMessage "install crypto-tlsca0" $?

set -x
kubectl wait --for=condition=complete --timeout 120s job/crypto-tlsca0-cryptogen -n n0
res=$?
set +x
printMessage "job/crypto-tlsca0-cryptogen" $res

helm install crypto-rca0 -n n0 -f ./releases/org0/rca0-cryptogen.gcp.yaml ./cryptogen
printMessage "install crypto-rca0" $?

set -x
kubectl wait --for=condition=complete --timeout 120s job/crypto-rca0-cryptogen -n n0
res=$?
set +x
printMessage "job/crypto-rca0-cryptogen" $res

# create secret
./scripts/create-secret.rca0.sh
printMessage "create secret rca0" $?

./scripts/create-secret.rca1.sh
printMessage "create secret rca1" $?

sleep 60

./scripts/create-genesis.sh
printMessage "create genesis block/channeltx" $?

sleep 2

helm install o1 -f ./releases/org0/o1-hlf-ord.gcp.yaml -n n0 ./hlf-ord

sleep 3

helm install o2 -f ./releases/org0/o2-hlf-ord.gcp.yaml -n n0 ./hlf-ord

sleep 3

helm install o3 -f ./releases/org0/o3-hlf-ord.gcp.yaml -n n0 ./hlf-ord

sleep 3

helm install o4 -f ./releases/org0/o4-hlf-ord.gcp.yaml -n n0 ./hlf-ord

sleep 3

helm install o0 -f ./releases/org0/o0-hlf-ord.gcp.yaml -n n0 ./hlf-ord

set -x
kubectl wait --for=condition=Available --timeout 600s deployment/o0-hlf-ord -n n0
res=$?
set +x
printMessage "deployment/o0-hlf-ord" $res

helm install p0o1db -n n1 -f ./releases/org1/p0o1db-hlf-couchdb.gcp.yaml ./hlf-couchdb

sleep 5

set -x
kubectl wait --for=condition=Available --timeout 600s deployment/p0o1db-hlf-couchdb -n n1
res=$?
set +x
printMessage "deployment/p0o1db-hlf-couchdb" $res

helm install p0o1 -n n1 -f ./releases/org1/p0o1-hlf-peer.gcp.yaml ./hlf-peer

set -x
kubectl wait --for=condition=Available --timeout 600s deployment/p0o1-hlf-peer -n n1
res=$?
set +x
printMessage "deployment/p0o1-hlf-peer" $res

export POD_CLI1=$(kubectl get pods --namespace n1 -l "app=orgadmin,release=admin1" -o jsonpath="{.items[0].metadata.name}")
preventEmptyValue "pod unavailable" $POD_CLI1

set -x
kubectl -n n1 cp ./chaincode $POD_CLI1:./channel-artifacts
res=$?
set +x
printMessage "copy chaincode" $res

helm install g1 -n n1 -f ./releases/org1/g1-gupload.gcp.yaml ./gupload

#sleep 60
#
# helm install bootstrap -n n1 -f ./releases/org1/bootstrap-hlf-operator.gcp.yaml ./hlf-operator
#
#set -x
#kubectl wait --for=condition=complete --timeout 600s job/bootstrap-hlf-operator--bootstrap -n n1
#res=$?
#set +x
#printMessage "job/bootstrap" $res

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"

#${BIN}/peer channel fetch 0 -c ${CHANNEL_NAME} --tls --cafile ${ORDERER_CA} -o ${ORDERER_URL} $DIR/${CHANNEL_NAME}.block

2020/09/09 19:29:21 [error] 41615#41615: *16476145 upstream rejected request with error 0 while reading response header from upstream,
 client: 10.52.0.145, server: _, request: "POST /orderer.AtomicBroadcast/Deliver HTTP/2.0", upstream: "grpcs://10.52.0.145:7051", host: "orderer0.org0.com:443"

2020-09-10 08:36:52.306 UTC [gossip.gossip] func1 -> WARN 027 Deep probe of peer0.org1.net:443 failed: context deadline exceeded
2020-09-10 08:36:52.306 UTC [gossip.discovery] func1 -> WARN 028 Could not connect to Endpoint: peer0.org1.net:443, InternalEndpoint: peer0.org1.net:443, PKI-ID: <nil>, Metadata:  : context deadline exceeded
2020-09-10 08:37:20.308 UTC [gossip.gossip] func1 -> WARN 029 Deep probe of peer0.org1.net:443 failed: context deadline exceeded
2020-09-10 08:37:20.308 UTC [gossip.discovery] func1 -> WARN 02a Could not connect to Endpoint: peer0.org1.net:443, InternalEndpoint: peer0.org1.net:443, PKI-ID: <nil>, Metadata:  : context deadline exceeded
2020-09-10 08:37:27.324 UTC [peer.blocksprovider] func1 -> WARN 02b Encountered an error reading from deliver stream: rpc error: code = Internal desc = stream terminated by RST_STREAM with error code: PROTOCOL_ERROR channel=loanapp orderer-address=orderer0.org0.com:44
