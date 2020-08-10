#!/bin/bash
. ./scripts/setup.sh
######## post-install notes for rca1/hlf-ca
######## Objective: These steps, create secret
######## - peer0.org1.net-cert peer0.org1.net-key
######## - peer0.org1.net-cacert peer0.org1.net-tls peer0.org1.net-tlsrootcert peer0.org1.net-admincert
######## - org1-cacerts
######## - org1-admincerts
######## - org1-tlscacerts
########
######## 1. secret: rca1-hlf-ca--ca is already set by secret manifest. Below command retrieves it.
# export CA_ADMIN=$(kubectl -n n1 get secret rca1-hlf-ca--ca -o jsonpath=".data.CA_ADMIN" | base64)
# export CA_PASSWORD=$(kubectl -n n1 get secret rca1-hlf-ca--ca -o jsonpath=".data.CA_PASSWORD" | base64)
export POD_RCA=$(kubectl get pods -n n1 -l "app=hlf-ca,release=rca1" -o jsonpath="{.items[0].metadata.name}")
preventEmptyValue "pod unavailable" $POD_RCA
######## 2. secret: cert and key
export CONTENT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/peer0.org1.net/msp/signcerts/cert.pem)
preventEmptyValue "./Org1MSP/peer0.org1.net/msp/signcerts/cert.pem" $CONTENT
kubectl -n n1 create secret generic peer0.org1.net-cert --from-literal=cert.pem="$CONTENT"
printMessage "create secret peer0.org1.net-cert" $?
export CONTENT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/peer0.org1.net/msp/keystore/key.pem)
preventEmptyValue "./Org1MSP/peer0.org1.net/msp/keystore/key.pem" $CONTENT
kubectl -n n1 create secret generic peer0.org1.net-key --from-literal=key.pem="$CONTENT"
printMessage "create secret peer0.org1.net-key" $?
######## 3. secret: CA cert
export CONTENT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/peer0.org1.net/msp/cacerts/0-0-0-0-7054.pem)
preventEmptyValue "./Org1MSP/peer0.org1.net/msp/cacerts/0-0-0-0-7054.pem" $CONTENT
kubectl -n n1 create secret generic peer0.org1.net-cacert --from-literal=cacert.pem="$CONTENT"
printMessage "create secret peer0.org1.net-cacert" $?
######## 4. secret: tls cert and key
export CERT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/peer0.org1.net/tls-msp/signcerts/cert.pem)
preventEmptyValue "./Org1MSP/peer0.org1.net/tls-msp/signcerts/cert.pem" $CONTENT
export KEY=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/peer0.org1.net/tls-msp/keystore/key.pem)
preventEmptyValue "./Org1MSP/peer0.org1.net/tls-msp/keystore/key.pem" $CONTENT
kubectl -n n1 create secret generic peer0.org1.net-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
printMessage "create secret peer0.org1.net-tls" $?
######## 5. secret: tls root CA cert
export CONTENT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem)
preventEmptyValue "./Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem" $CONTENT
kubectl -n n1 create secret generic peer0.org1.net-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
printMessage "create secret peer0.org1.net-tlsrootcert" $?
######## 6. create secret for org1.net-admin-cert.pem
export CONTENT=$(kubectl -n n1 exec $POD_RCA -- sh -c "cat ./Org1MSP/admin/msp/admincerts/*.pem")
preventEmptyValue "./Org1MSP/admin/msp/admincerts/*.pem" $CONTENT
kubectl -n n1 create secret generic peer0.org1.net-admincert --from-literal=org1.net-admin-cert.pem="$CONTENT"
printMessage "create secret peer0.org1.net-admincert" $?
######## 7. create secret for org1.net-admin-key.pem
export CONTENT=$(kubectl -n n1 exec $POD_RCA -- sh -c "cat ./Org1MSP/admin/msp/keystore/key.pem")
preventEmptyValue "./Org1MSP/admin/msp/keystore/key.pem" $CONTENT
kubectl -n n1 create secret generic peer0.org1.net-adminkey --from-literal=org1.net-admin-key.pem="$CONTENT"
printMessage "create secret peer0.org1.net-adminkey" $?
######## 8. create secret org1.net-ca-cert.pem for Org0
export CERT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/msp/cacerts/org1.net-ca-cert.pem)
preventEmptyValue "./Org1MSP/msp/cacerts/org1.net-ca-cert.pem" $CONTENT
kubectl -n n0 create secret generic org1-cacerts --from-literal=org1.net-ca-cert.pem="$CERT"
printMessage "create secret org1-cacerts" $?
######## 9. create secret org1.net-admin-cert.pem for Org0
export CERT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/msp/admincerts/org1.net-admin-cert.pem)
preventEmptyValue "./Org1MSP/msp/admincerts/org1.net-admin-cert.pem" $CONTENT
kubectl -n n0 create secret generic org1-admincerts --from-literal=org1.net-admin-cert.pem="$CERT"
printMessage "create secret org1-admincerts" $?
######## 10. create secret org1.net-ca-cert.pem for Org0
export CERT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/msp/tlscacerts/tls-ca-cert.pem)
preventEmptyValue "./Org1MSP/msp/tlscacerts/tls-ca-cert.pem" $CONTENT
kubectl -n n0 create secret generic org1-tlscacerts --from-literal=tls-ca-cert.pem="$CERT"
printMessage "create secret org1-tlscacerts" $?
