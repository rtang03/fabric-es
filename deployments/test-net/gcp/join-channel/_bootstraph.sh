#!/bin/bash
. ./scripts/setup.sh

./scripts/rm-secret.n0.sh
./scripts/rm-secret.n1.sh

helm install admin1 -n n1 -f ./orgadmin/values-admin1.local.yaml ./orgadmin
printMessage "install admin1" $?

sleep 2
helm install tlsca1 -n n1 -f ./hlf-ca/values-tlsca1.yaml ./hlf-ca
printMessage "install tlsca1" $?

sleep 2
helm install rca1 -n n1 -f ./hlf-ca/values-rca1.yaml ./hlf-ca
printMessage "install rca1" $?

sleep 1

set -x
kubectl wait --for=condition=Available --timeout 600s deployment/admin1-orgadmin-cli -n n1
printMessage "deployment/admin1-orgadmin-cli" $?
set +x

helm install crypto-tlsca1 -n n1 -f ./cryptogen/values-tlsca1.yaml ./cryptogen
printMessage "install crypto-tlsca1" $?

sleep 1

set -x
kubectl wait --for=condition=complete --timeout 60s job/crypto-tlsca1-cryptogen -n n1
printMessage "job/crypto-tlsca1-cryptogen " $?
set +x

helm install crypto-rca1 -n n1 -f ./cryptogen/values-rca1.yaml ./cryptogen
printMessage "install crypto-rca1" $?

sleep 1

set -x
kubectl wait --for=condition=complete --timeout 120s job/crypto-rca1-cryptogen -n n1
printMessage "job/crypto-rca1-cryptogen" $?
set +x

  # Org0
helm install admin0 -n n0 -f ./orgadmin/values-admin0.local.yaml ./orgadmin
printMessage "install admin0" $?

sleep 2

helm install tlsca0 -n n0 -f ./hlf-ca/values-tlsca0.yaml ./hlf-ca
printMessage "install tlsca0" $?

sleep 2

helm install rca0 -n n0 -f ./hlf-ca/values-rca0.yaml ./hlf-ca
printMessage "install rca0" $?

set -x
kubectl wait --for=condition=Available --timeout 600s deployment/admin0-orgadmin-cli -n n0
printMessage "deployment/admin0-orgadmin-cli" $?
set +x

helm install crypto-tlsca0 -n n0 -f ./cryptogen/values-tlsca0.yaml ./cryptogen
printMessage "install crypto-tlsca0" $?

sleep 1

set -x
kubectl wait --for=condition=complete --timeout 60s job/crypto-tlsca0-cryptogen -n n0
printMessage "job/crypto-tlsca0-cryptogen" $?
set +x

helm install crypto-rca0 -n n0 -f ./cryptogen/values-rca0.yaml ./cryptogen
printMessage "install crypto-rca0" $?

sleep 1

set -x
kubectl wait --for=condition=complete --timeout 120s job/crypto-rca0-cryptogen -n n0
printMessage "job/crypto-rca0-cryptogen" $?
set +x

  # create secret
./scripts/create-secret.rca0.sh
printMessage "create secret rca0" $?

./scripts/create-secret.rca1.sh
printMessage "create secret rca1" $?

sleep 5

./scripts/create-genesis.sh
printMessage "create genesis block/channeltx" $?

sleep 3

helm install o1 -f ./hlf-ord/values-O1.yaml -n n0 ./hlf-ord

sleep 3

helm install o2 -f ./hlf-ord/values-O2.yaml -n n0 ./hlf-ord

sleep 3

helm install o3 -f ./hlf-ord/values-O3.yaml -n n0 ./hlf-ord

sleep 3

helm install o4 -f ./hlf-ord/values-O4.yaml -n n0 ./hlf-ord

sleep 3

helm install o0 -f ./hlf-ord/values-O0.yaml -n n0 ./hlf-ord

set -x
kubectl wait --for=condition=Available --timeout 600s deployment/o0-hlf-ord -n n0
printMessage "deployment/o0-hlf-ord" $?
set +x

helm install p0o1db -n n1 ./hlf-couchdb

sleep 5

set -x
kubectl wait --for=condition=Available --timeout 600s deployment/p0o1db-hlf-couchdb -n n1
printMessage "deployment/p0o1db-hlf-couchdb" $?
set +x

