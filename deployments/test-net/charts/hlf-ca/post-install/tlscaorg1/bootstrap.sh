#!/bin/bash

######## 1. Get the name of the pod running tls-ca:
export POD_TLS_CA=$(kubectl get pods -n n1 -l "app=hlf-ca,release=tlsca1" -o jsonpath="{.items[0].metadata.name}")

######## 2. Enrol tls-ca admin:
kubectl -n n1 exec $POD_TLS_CA -- sh -c "fabric-ca-client enroll -d -u http://tlsca1-admin:tlsca1-adminPW@0.0.0.0:7054"

######## 3. Create secret for tls, used by ingress controller
# If there is pre-existing secret, tlsca1-tls , you need to remove it with:
# kubectl -n n1 delete secret tlsca1-tls
kubectl -n n1 exec $POD_TLS_CA -- sh -c "mv ./Org1MSP/tls/server/msp/keystore/*_sk ./Org1MSP/tls/server/msp/keystore/key.pem"
export CERT=$(kubectl -n n1 exec ${POD_TLS_CA} -- cat ./Org1MSP/tls/server/ca-cert.pem)
export KEY=$(kubectl -n n1 exec ${POD_TLS_CA} -- cat ./Org1MSP/tls/server/msp/keystore/key.pem)
kubectl -n n1 create secret generic tlsca1-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"


######## 4. Register peer:
kubectl -n n1 exec $POD_TLS_CA -- sh -c "fabric-ca-client register -d --id.name peer0.org1.net --id.secret peer0.org1.netPW --id.type peer -u http://0.0.0.0:7054"

######## 5. Enrol tls-ca for peer
kubectl -n n1 exec $POD_TLS_CA -- sh -c "FABRIC_CA_CLIENT_MSPDIR=tls-msp FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org1MSP/peer0.org1.net fabric-ca-client enroll -d -u http://peer0.org1.net:peer0.org1.netPW@0.0.0.0:7054 --enrollment.profile tls --csr.hosts peer0-org1,127,0.0.1"
sleep 1

######## 6. Rename private key
kubectl -n n1 exec $POD_TLS_CA -- sh -c "cp ./Org1MSP/tls/admin/msp/cacerts/0-0-0-0-7054.pem ./Org1MSP/peer0.org1.net/tls-ca-cert.pem"
sleep 2
kubectl -n n1 exec $POD_TLS_CA -- sh -c "mv ./Org1MSP/peer0.org1.net/tls-msp/keystore/*_sk ./Org1MSP/peer0.org1.net/tls-msp/keystore/key.pem"
