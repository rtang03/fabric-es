#!/bin/bash

######## 1. secret: rca1-hlf-ca--ca is already set by secret manifest. Below command retrieves it.
# export CA_ADMIN=$(kubectl -n n1 get secret rca1-hlf-ca--ca -o jsonpath=".data.CA_ADMIN" | base64 -d)
# export CA_PASSWORD=$(kubectl -n n1 get secret rca1-hlf-ca--ca -o jsonpath=".data.CA_PASSWORD" | base64 -d)
export POD_RCA=$(kubectl get pods -n n1 -l "app=hlf-ca,release=rca1" -o jsonpath="{.items[0].metadata.name}")

######## 2. secret: cert and key
export CONTENT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/peer0.org1.net/msp/signcerts/cert.pem)
kubectl -n n1 create secret generic peer0.org1.net-cert --from-literal=cert.pem="$CONTENT"
export CONTENT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/peer0.org1.net/msp/keystore/key.pem)
kubectl -n n1 create secret generic peer0.org1.net-key --from-literal=key.pem="$CONTENT"

######## 3. secret: CA cert
export CONTENT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/peer0.org1.net/msp/cacerts/0-0-0-0-7054.pem)
kubectl -n n1 create secret generic peer0.org1.net-cacert --from-literal=cacert.pem="$CONTENT"

######## 4. secret: tls cert and key
export CERT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/peer0.org1.net/tls-msp/signcerts/cert.pem)
export KEY=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/peer0.org1.net/tls-msp/keystore/key.pem)
kubectl -n n1 create secret generic peer0.org1.net-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"

######## 5. secret: tls root CA cert
export CONTENT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem)
kubectl -n n1 create secret generic peer0.org1.net-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"

######## 6. create secret for org1.net-admin-cert.pem
export CONTENT=$(kubectl -n n1 exec $POD_RCA -- sh -c "cat ./Org1MSP/peer0.org1.net/msp/admincerts/*.pem")
kubectl -n n1 create secret generic peer0.org1.net-admincert --from-literal=org1.net-admin-cert.pem="$CONTENT"
