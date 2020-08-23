#!/bin/bash
. ./scripts/setup.sh

SECONDS=0

./scripts/rm-secret.n0.sh
./scripts/rm-secret.n1.sh

# Note: Manually deploy PV
# kubectl -n n0 create -f ./releases/org0/volumes/pvc-org0.local.yaml
# kubectl -n n0 create -f ./releases/org0/volumes/pvc-orderers.local.yaml
# kubectl -n n1 create -f ./releases/org1/volumes/pvc-org1.local.yaml
# kubectl -n n1 create -f ./releases/org1/volumes/pvc-p0o1db.local.yaml
# kubectl -n n1 create -f ./releases/org1/volumes/pvc-p0o1.local.yaml
# printMessage "create pv/pvc for org1" $?

helm install admin1 -n n1 -f ./releases/org1/admin1-orgadmin.local.yaml ./orgadmin
printMessage "install admin1" $?

sleep 2
helm install tlsca1 -n n1 -f ./releases/org1/tlsca1-hlf-ca.local.yaml ./hlf-ca
printMessage "install tlsca1" $?

sleep 2
helm install rca1 -n n1 -f ./releases/org1/rca1-hlf-ca.local.yaml ./hlf-ca
printMessage "install rca1" $?

sleep 1

set -x
kubectl wait --for=condition=Available --timeout 600s deployment/admin1-orgadmin-cli -n n1
res=$?
set +x
printMessage "deployment/admin1-orgadmin-cli" $res

helm install crypto-tlsca1 -n n1 -f ./releases/org1/tlsca1-cryptogen.local.yaml ./cryptogen
printMessage "install crypto-tlsca1" $?

sleep 1

set -x
kubectl wait --for=condition=complete --timeout 60s job/crypto-tlsca1-cryptogen -n n1
res=$?
set +x
printMessage "job/crypto-tlsca1-cryptogen " $res

helm install crypto-rca1 -n n1 -f ./releases/org1/rca1-cryptogen.local.yaml ./cryptogen
printMessage "install crypto-rca1" $?

sleep 1

set -x
kubectl wait --for=condition=complete --timeout 120s job/crypto-rca1-cryptogen -n n1
res=$?
set +x
printMessage "job/crypto-rca1-cryptogen" $res

# Org0
helm install admin0 -n n0 -f ./releases/org0/admin0-orgadmin.local.yaml ./orgadmin
printMessage "install admin0" $?

sleep 2

helm install tlsca0 -n n0 -f ./releases/org0/tlsca0-hlf-ca.local.yaml ./hlf-ca
printMessage "install tlsca0" $?

sleep 2

helm install rca0 -n n0 -f ./releases/org0/rca0-hlf-ca.local.yaml ./hlf-ca
printMessage "install rca0" $?

set -x
kubectl wait --for=condition=Available --timeout 600s deployment/admin0-orgadmin-cli -n n0
res=$?
set +x
printMessage "deployment/admin0-orgadmin-cli" $res

helm install crypto-tlsca0 -n n0 -f ./releases/org0/tlsca0-cryptogen.local.yaml ./cryptogen
printMessage "install crypto-tlsca0" $?

sleep 1

set -x
kubectl wait --for=condition=complete --timeout 60s job/crypto-tlsca0-cryptogen -n n0
res=$?
set +x
printMessage "job/crypto-tlsca0-cryptogen" $res

helm install crypto-rca0 -n n0 -f ./releases/org0/rca0-cryptogen.local.yaml ./cryptogen
printMessage "install crypto-rca0" $?

sleep 1

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

sleep 2

# ./scripts/create-genesis.sh
# printMessage "create genesis block/channeltx" $?
#
# sleep 3
#
# helm install o1 -f ./hlf-ord/values-O1.yaml -n n0 ./hlf-ord
#
# sleep 3
#
# helm install o2 -f ./hlf-ord/values-O2.yaml -n n0 ./hlf-ord
#
# sleep 3
#
# helm install o3 -f ./hlf-ord/values-O3.yaml -n n0 ./hlf-ord
#
# sleep 3
#
# helm install o4 -f ./hlf-ord/values-O4.yaml -n n0 ./hlf-ord
#
# sleep 3
#
# helm install o0 -f ./hlf-ord/values-O0.yaml -n n0 ./hlf-ord
#
# set -x
# kubectl wait --for=condition=Available --timeout 600s deployment/o0-hlf-ord -n n0
# printMessage "deployment/o0-hlf-ord" $?
# set +x
#
# helm install p0o1db -n n1 ./hlf-couchdb
#
# sleep 5
#
# set -x
# kubectl wait --for=condition=Available --timeout 600s deployment/p0o1db-hlf-couchdb -n n1
# printMessage "deployment/p0o1db-hlf-couchdb" $?
# set +x
#
# helm install p0o1 -n n1 ./hlf-peer
#
# set -x
# kubectl wait --for=condition=Available --timeout 600s deployment/p0o1-hlf-peer -n n1
# printMessage "deployment/p0o1-hlf-peer" $?
# set +x

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
