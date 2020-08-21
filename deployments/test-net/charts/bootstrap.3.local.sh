#!/bin/bash
. ./scripts/setup.sh

SECONDS=0

export POD_CLI1=$(kubectl get pods --namespace n1 -l "app=orgadmin,release=admin1" -o jsonpath="{.items[0].metadata.name}")
preventEmptyValue "pod unavailable" $POD_CLI1

set -x
kubectl -n n1 cp ./chaincode $POD_CLI1:./channel-artifacts
res=$?
set +x
printMessage "copy chaincode" $res

helm install bootstrap -n n1 -f ./hlf-operator/values-run-all.yaml ./hlf-operator

set -x
kubectl wait --for=condition=complete --timeout 600s job/bootstrap-hlf-operator -n n1
res=$?
set +x
printMessage "job/bootstrap" $res

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
