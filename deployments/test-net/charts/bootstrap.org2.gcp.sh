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

export POD_CLI2=$(kubectl get pods -n n2 -l "app=orgadmin,release=admin2" -o jsonpath="{.items[0].metadata.name}")
preventEmptyValue "pod unavailable" $POD_CLI2

helm install g2 -n n2 -f ./releases/org2/g2-gupload.gcp.yaml ./gupload

#####################################################################
### OUT OF BAND
#####################################################################
echo "# ORG1: Out-of-band process: Manually send p0o1.crt from org2 to org1"
export POD_RCA2=$(kubectl get pods -n n2 -l "app=hlf-ca,release=rca2" -o jsonpath="{.items[0].metadata.name}")
preventEmptyValue "pod unavailable" $POD_RCA2

set -x
kubectl -n n2 exec $POD_RCA2 -- cat ./Org2MSP/peer0.org2.net/tls-msp/signcerts/cert.pem > ./download/p0o2.crt
res=$?
set +x
printMessage "download /Org2MSP/peer0.org2.net/tls-msp/signcerts/cert.pem from n2" $res

set -x
kubectl -n n1 create secret generic peer0.org2.net-tls --from-file=tls.crt=./download/p0o2.crt
res=$?
set +x
printMessage "create secret peer0.org2.net-tls for n1" $res

####
echo "# ORG2: Out-of-band process: Manually send p0o2.crt from org1 to org2"
export POD_RCA1=$(kubectl get pods -n n1 -l "app=hlf-ca,release=rca1" -o jsonpath="{.items[0].metadata.name}")
preventEmptyValue "pod unavailable" $POD_RCA1

set -x
kubectl -n n1 exec $POD_RCA1 -- cat ./Org1MSP/peer0.org1.net/tls-msp/signcerts/cert.pem > ./download/p0o1.crt
res=$?
set +x
printMessage "download Org1MSP/peer0.org1.net/tls-msp/signcerts/cert.pem from n1" $res

set -x
kubectl -n n2 create secret generic peer0.org1.net-tls --from-file=tls.crt=./download/p0o1.crt
res=$?
set +x
printMessage "create secret peer0.org1.net-tls for n2" $res

export POD_RCA0=$(kubectl get pods -n n0 -l "app=hlf-ca,release=rca0" -o jsonpath="{.items[0].metadata.name}")
preventEmptyValue "pod unavailable" $POD_RCA0

set -x
kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer0.org0.com/tls-msp/signcerts/cert.pem > ./download/orderer0.crt
res=$?
set +x
printMessage "download Org0MSP/orderer0.org0.com/tls-msp/signcerts/cert.pem from n0" $res

set -x
kubectl -n n2 create secret generic orderer0.org0.com-tlssigncert --from-file=cert.pem=./download/orderer0.crt
res=$?
set +x
printMessage "create secret orderer0.org0.com-tlssigncert for n2" $res

set -x
kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer0.org0.com/tls-msp/tlscacerts/tls-tlsca0-hlf-ca-n0-svc-cluster-local-7054.pem > ./download/orderer0-tlsroot.crt
res=$?
set +x
printMessage "download Org0MSP/orderer0.org0.com/tls-msp/tlscacerts/tls-tlsca0-hlf-ca-n0-svc-cluster-local-7054.pem from n0" $res

set -x
kubectl -n n2 create secret generic orderer0.org0.com-tlsrootcert --from-file=tlscacert.pem=./download/orderer0-tlsroot.crt
res=$?
set +x
printMessage "create secret orderer0.org0.com-tlsrootcert for n2" $res

set -x
kubectl -n n0 exec $POD_RCA0 -- sh -c "cat ./Org0MSP/msp/tlscacerts/tls-ca-cert.pem" > ./download/org0tlscacert.crt
res=$?
set +x
printMessage "download Org0MSP/msp/tlscacerts/tls-ca-cert.pem from n0" $res

set -x
kubectl -n n2 create secret generic org0-tls-ca-cert --from-file=tlscacert.pem=./download/org0tlscacert.crt
res=$?
set +x
printMessage "create secret org0-tls-ca-cert for n2" $res
#####################################################################
### END: OUT OF BAND
#####################################################################

# After all secrets are available
helm install p0o2 -n n2 -f ./releases/org2/p0o2-hlf-peer.gcp.yaml ./hlf-peer

set -x
kubectl wait --for=condition=Available --timeout 600s deployment/p0o2-hlf-peer -n n2
res=$?
set +x
printMessage "deployment/p0o2-hlf-peer" $res

sleep 15

### MULTIPLE ORGS WORKFLOW
## org1 admin tasks
helm install fetch1 -n n1 -f ./releases/org1/fetchsend-hlf-operator.gcp.yaml ./hlf-operator

set -x
kubectl wait --for=condition=complete --timeout 120s job/fetch1-hlf-operator -n n1
res=$?
set +x
printMessage "job/fetch1-hlf-operator" $res

## org2 admin tasks
helm install neworg2 -n n2 -f ./releases/org2/neworgsend-hlf-operator.gcp.yaml ./hlf-operator

set -x
kubectl wait --for=condition=complete --timeout 120s job/neworg2-hlf-operator -n n2
res=$?
set +x
printMessage "job/neworg2-hlf-operator" $res

## org1 admin tasks
helm install upch1 -n n1 -f ./releases/org1/upch1-hlf-operator.gcp.yaml ./hlf-operator

set -x
kubectl wait --for=condition=complete --timeout 120s job/upch1-hlf-operator -n n1
res=$?
set +x
printMessage "job/upch1-hlf-operator" $res

## org2 admin tasks
helm install joinch2 -n n2 -f ./releases/org2/joinch2-hlf-operator.gcp.yaml ./hlf-operator

set -x
kubectl wait --for=condition=complete --timeout 120s job/joinch2-hlf-operator -n n2
res=$?
set +x
printMessage "job/joinch2-hlf-operator" $res

duration=$SECONDS
printf "${GREEN}$(($duration / 60)) minutes and $(($duration % 60)) seconds elapsed.\n\n${NC}"
