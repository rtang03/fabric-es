#!/bin/bash
. ./scripts/setup.sh

SECONDS=0

./scripts/rm-secret.n0.sh
./scripts/rm-secret.n1.sh

helm install admin1 -n n1 -f ./releases/org1/admin1-orgadmin.gcp.yaml ./orgadmin
printMessage "install admin1" $?

sleep 2
helm install tlsca1 -n n1 -f ./releases/org1/tlsca1-hlf-ca.common.yaml ./hlf-ca
printMessage "install tlsca1" $?

sleep 2
helm install rca1 -n n1 -f ./releases/org1/rca1-hlf-ca.common.yaml ./hlf-ca
printMessage "install rca1" $?

sleep 1

set -x
kubectl wait --for=condition=Available --timeout 600s deployment/admin1-orgadmin-cli -n n1
res=$?
set +x
printMessage "deployment/admin1-orgadmin-cli" $res

helm install crypto-tlsca1 -n n1 -f ./releases/org1/tlsca1-cryptogen.common.yaml ./cryptogen
printMessage "install crypto-tlsca1" $?

sleep 1

set -x
kubectl wait --for=condition=complete --timeout 60s job/crypto-tlsca1-cryptogen -n n1
res=$?
set +x
printMessage "job/crypto-tlsca1-cryptogen " $res

helm install crypto-rca1 -n n1 -f ./releases/org1/rca1-cryptogen.common.yaml ./cryptogen
printMessage "install crypto-rca1" $?

sleep 1

set -x
kubectl wait --for=condition=complete --timeout 120s job/crypto-rca1-cryptogen -n n1
res=$?
set +x
printMessage "job/crypto-rca1-cryptogen" $res

# Org0
helm install admin0 -n n0 -f ./releases/org0/admin0-orgadmin.gcp.yaml ./orgadmin
printMessage "install admin0" $?

sleep 2

helm install tlsca0 -n n0 -f ./releases/org0/tlsca0-hlf-ca.common.yaml ./hlf-ca
printMessage "install tlsca0" $?

sleep 2

helm install rca0 -n n0 -f ./releases/org0/rca0-hlf-ca.common.yaml ./hlf-ca
printMessage "install rca0" $?

set -x
kubectl wait --for=condition=Available --timeout 600s deployment/admin0-orgadmin-cli -n n0
res=$?
set +x
printMessage "deployment/admin0-orgadmin-cli" $res

helm install crypto-tlsca0 -n n0 -f ./releases/org0/tlsca0-cryptogen.common.yaml ./cryptogen
printMessage "install crypto-tlsca0" $?

sleep 1

set -x
kubectl wait --for=condition=complete --timeout 60s job/crypto-tlsca0-cryptogen -n n0
res=$?
set +x
printMessage "job/crypto-tlsca0-cryptogen" $res

helm install crypto-rca0 -n n0 -f ./releases/org0/rca0-cryptogen.common.yaml ./cryptogen
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
duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
