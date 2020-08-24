#!/bin/bash
. ./scripts/setup.sh

SECONDS=0

sleep 3

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

helm install p0o1db -n n1 -f ./releases/org1/p0o1-hlf-couchdb.gcp.yaml ./hlf-couchdb

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

helm install bootstrap -n n1 -f ./releases/org1/bootstrap-hlf-operator.gcp.yaml ./hlf-operator

set -x
kubectl wait --for=condition=complete --timeout 600s job/bootstrap-hlf-operator -n n1
res=$?
set +x
printMessage "job/bootstrap" $res

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
