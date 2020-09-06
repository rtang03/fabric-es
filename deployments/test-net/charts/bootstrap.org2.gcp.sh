#!/bin/bash
. ./scripts/setup.sh

SECONDS=0

./scripts/rm-secret.n2.sh

# Note: Manually deploy PV
#kubectl -n n2 create -f ../releases/org2/volumes/pvc-org2.gcp.yaml
#kubectl -n n2 create -f ../releases/org2/volumes/pvc-p0o2.gcp.yaml
# printMessage "create pv/pvc for org2" $?


helm install admin2 -n n2 -f ./releases/org2/admin2-orgadmin.gcp.yaml ./orgadmin
printMessage "install admin2" $?

set -x
kubectl wait --for=condition=Available --timeout 60s deployment/admin2-orgadmin-cli -n n2
res=$?
set +x
printMessage "deployment/admin2-orgadmin-cli" $res

# postgres db is deployed with statefulset; of which "--wait" does not support.
sleep 60

helm install tlsca2 -n n2 -f ./releases/org2/tlsca2-hlf-ca.gcp.yaml ./hlf-ca
printMessage "install tlsca2" $?

set -x
kubectl wait --for=condition=Available --timeout 60s deployment/tlsca2-hlf-ca -n n2
res=$?
set +x
printMessage "deployment/tlsca2-orgadmin-cli" $res

sleep 5

helm install rca2 -n n2 -f ./releases/org2/rca2-hlf-ca.gcp.yaml ./hlf-ca

set -x
kubectl wait --for=condition=Available --timeout 60s deployment/rca2-hlf-ca -n n2
res=$?
set +x
printMessage "deployment/rca2-hlf-ca" $res

sleep 30

helm install crypto-tlsca2 -n n2 -f ./releases/org2/tlsca2-cryptogen.gcp.yaml ./cryptogen
printMessage "install crypto-tlsca2" $?

set -x
kubectl wait --for=condition=complete --timeout 120s job/crypto-tlsca2-cryptogen -n n2
res=$?
set +x
printMessage "job/crypto-tlsca2-cryptogen" $res

helm install crypto-rca2 -n n2 -f ./releases/org2/rca2-cryptogen.gcp.yaml ./cryptogen
printMessage "install crypto-rca2" $?

set -x
kubectl wait --for=condition=complete --timeout 120s job/crypto-rca2-cryptogen -n n2
res=$?
set +x
printMessage "job/crypto-rca2-cryptogen" $res

./scripts/create-secret.rca2.sh
printMessage "create secret rca2" $?

helm install p0o2db -n n2 -f ./releases/org2/p0o2db-hlf-couchdb.gcp.yaml ./hlf-couchdb

sleep 5

set -x
kubectl wait --for=condition=Available --timeout 600s deployment/p0o2db-hlf-couchdb -n n2
res=$?
set +x
printMessage "deployment/p0o2db-hlf-couchdb" $res

helm install p0o2 -n n2 -f ./releases/org2/p0o2-hlf-peer.gcp.yaml ./hlf-peer

set -x
kubectl wait --for=condition=Available --timeout 600s deployment/p0o2-hlf-peer -n n2
res=$?
set +x
printMessage "deployment/p0o2-hlf-peer" $res

export POD_CLI2=$(kubectl get pods -n n2 -l "app=orgadmin,release=admin2" -o jsonpath="{.items[0].metadata.name}")
preventEmptyValue "pod unavailable" $POD_CLI2

helm install g2 -n n2 -f ./releases/org2/g2-gupload.gcp.yaml ./gupload

# org1 operator's tasks
# Manually send
kubectl -n n1 create secret generic peer0.org2.net-tls --from-file=tls.crt=./download/p0o2.crt

helm install fetch1 -n n1 -f ./releases/org1/fetchsend-hlf-operator.gcp.yaml ./hlf-operator

helm install addorg -n n2 -f ./releases/org2/addorg-hlf-operator.gcp.yaml ./hlf-operator

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"

# ./build/gupload upload --cacert ./cert/p0o1.crt --file ../yarn.lock --label 007 --filename yarn.lock --address p0o1-hlf-peer:443

./uploaded/peer channel fetch config /var/hyperledger/uploaded/config_block.pb -o ${ORDERER_URL} -c ${CHANNEL_NAME} --tls --cafile ${ORDERER_CA}
