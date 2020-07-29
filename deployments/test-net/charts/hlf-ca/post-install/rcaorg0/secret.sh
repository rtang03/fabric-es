#!/bin/bash

######## 1. secret: rcaorg0-hlf-ca--ca is already set by secret manifest. Below command retrieves it.
# export CA_ADMIN=$(kubectl -n default get secret rcaorg0-hlf-ca--ca -o jsonpath=".data.CA_ADMIN" | base64 -d)
# export CA_PASSWORD=$(kubectl -n default get secret rcaorg0-hlf-ca--ca -o jsonpath=".data.CA_PASSWORD" | base64 -d)

######## 2. secret: cert and key
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer0.org0.com/msp/signcerts/cert.pem)
kubectl -n default create secret generic orderer0.org0.com-cert --from-literal=cert.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer0.org0.com/msp/keystore/key.pem)
kubectl -n default create secret generic orderer0.org0.com-key --from-literal=key.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer1.org0.com/msp/signcerts/cert.pem)
kubectl -n default create secret generic orderer1.org0.com-cert --from-literal=cert.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer1.org0.com/msp/keystore/key.pem)
kubectl -n default create secret generic orderer1.org0.com-key --from-literal=key.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer2.org0.com/msp/signcerts/cert.pem)
kubectl -n default create secret generic orderer2.org0.com-cert --from-literal=cert.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer2.org0.com/msp/keystore/key.pem)
kubectl -n default create secret generic orderer2.org0.com-key --from-literal=key.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer3.org0.com/msp/signcerts/cert.pem)
kubectl -n default create secret generic orderer3.org0.com-cert --from-literal=cert.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer3.org0.com/msp/keystore/key.pem)
kubectl -n default create secret generic orderer3.org0.com-key --from-literal=key.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer4.org0.com/msp/signcerts/cert.pem)
kubectl -n default create secret generic orderer4.org0.com-cert --from-literal=cert.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer4.org0.com/msp/keystore/key.pem)
kubectl -n default create secret generic orderer4.org0.com-key --from-literal=key.pem="$CONTENT"

######## 2. secret: CA cert
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer0.org0.com/msp/cacerts/0-0-0-0-7054.pem)
kubectl -n default create secret generic orderer0.org0.com-cacert --from-literal=/cacert.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer1.org0.com/msp/cacerts/0-0-0-0-7054.pem)
kubectl -n default create secret generic orderer1.org0.com-cacert --from-literal=/cacert.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer2.org0.com/msp/cacerts/0-0-0-0-7054.pem)
kubectl -n default create secret generic orderer2.org0.com-cacert --from-literal=/cacert.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer3.org0.com/msp/cacerts/0-0-0-0-7054.pem)
kubectl -n default create secret generic orderer3.org0.com-cacert --from-literal=/cacert.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer4.org0.com/msp/cacerts/0-0-0-0-7054.pem)
kubectl -n default create secret generic orderer4.org0.com-cacert --from-literal=/cacert.pem="$CONTENT"

######## 3. secret: tls cert and key
export CERT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer0.org0.com/tls-msp/signcerts/cert.pem)
export KEY=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer0.org0.com/tls-msp/key/key.pem)
kubectl -n default create secret generic orderer0.org0.com-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
export CERT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer1.org0.com/tls-msp/signcerts/cert.pem)
export KEY=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer1.org0.com/tls-msp/key/key.pem)
kubectl -n default create secret generic orderer1.org0.com-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
export CERT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer2.org0.com/tls-msp/signcerts/cert.pem)
export KEY=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer2.org0.com/tls-msp/key/key.pem)
kubectl -n default create secret generic orderer2.org0.com-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
export CERT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer3.org0.com/tls-msp/signcerts/cert.pem)
export KEY=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer3.org0.com/tls-msp/key/key.pem)
kubectl -n default create secret generic orderer3.org0.com-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
export CERT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer4.org0.com/tls-msp/signcerts/cert.pem)
export KEY=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer4.org0.com/tls-msp/key/key.pem)
kubectl -n default create secret generic orderer4.org0.com-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"

######## 4. secret: tls root CA cert
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer0.org0.com/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem)
kubectl -n default create secret generic orderer0.org0.com-tlsrootcert --from-literal=/tlscacert.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer1.org0.com/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem)
kubectl -n default create secret generic orderer1.org0.com-tlsrootcert --from-literal=/tlscacert.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer2.org0.com/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem)
kubectl -n default create secret generic orderer2.org0.com-tlsrootcert --from-literal=/tlscacert.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer3.org0.com/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem)
kubectl -n default create secret generic orderer3.org0.com-tlsrootcert --from-literal=/tlscacert.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer4.org0.com/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem)
kubectl -n default create secret generic orderer4.org0.com-tlsrootcert --from-literal=/tlscacert.pem="$CONTENT"

######## 5. secret: genesis.block
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer0.org0.com/genesis/genesis.block)
kubectl -n default create secret generic orderer0.org0.com-genesis --from-literal=genesis.block="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer1.org0.com/genesis/genesis.block)
kubectl -n default create secret generic orderer1.org0.com-genesis --from-literal=genesis.block="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer2.org0.com/genesis/genesis.block)
kubectl -n default create secret generic orderer2.org0.com-genesis --from-literal=genesis.block="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer3.org0.com/genesis/genesis.block)
kubectl -n default create secret generic orderer3.org0.com-genesis --from-literal=genesis.block="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- cat ./Org0MSP/orderer4.org0.com/genesis/genesis.block)
kubectl -n default create secret generic orderer4.org0.com-genesis --from-literal=genesis.block="$CONTENT"

######## 6. create secret for org0.com-admin-cert.pem
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- sh -c "cat ./Org0MSP/orderer0.org0.com/msp/admincerts/*.pem")
kubectl -n default create secret generic orderer0.org0.com-admincert --from-file=org0.com-admin-cert.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- sh -c "cat ./Org0MSP/orderer1.org0.com/msp/admincerts/*.pem")
kubectl -n default create secret generic orderer1.org0.com-admincert --from-file=org0.com-admin-cert.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- sh -c "cat ./Org0MSP/orderer2.org0.com/msp/admincerts/*.pem")
kubectl -n default create secret generic orderer2.org0.com-admincert --from-file=org0.com-admin-cert.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- sh -c "cat ./Org0MSP/orderer3.org0.com/msp/admincerts/*.pem")
kubectl -n default create secret generic orderer3.org0.com-admincert --from-file=org0.com-admin-cert.pem="$CONTENT"
export CONTENT=$(kubectl -n default exec $POD_RCA_ORG0 -- sh -c "cat ./Org0MSP/orderer4.org0.com/msp/admincerts/*.pem")
kubectl -n default create secret generic orderer4.org0.com-admincert --from-file=org0.com-admin-cert.pem="$CONTENT"
