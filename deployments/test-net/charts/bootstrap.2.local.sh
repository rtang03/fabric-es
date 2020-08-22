#!/bin/bash
. ./scripts/setup.sh

SECONDS=0

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
res=$?
set +x
printMessage "deployment/o0-hlf-ord" $res

helm install p0o1db -n n1 ./hlf-couchdb

sleep 5

set -x
kubectl wait --for=condition=Available --timeout 600s deployment/p0o1db-hlf-couchdb -n n1
res=$?
set +x
printMessage "deployment/p0o1db-hlf-couchdb" $res

helm install p0o1 -n n1 ./hlf-peer

set -x
kubectl wait --for=condition=Available --timeout 600s deployment/p0o1-hlf-peer -n n1
res=$?
set +x
printMessage "deployment/p0o1-hlf-peer" $res

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
