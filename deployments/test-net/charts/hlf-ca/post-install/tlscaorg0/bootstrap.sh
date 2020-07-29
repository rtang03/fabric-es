#!/bin/bash

######## 1. Get the name of the pod running tls-ca:
export POD_TLS_CA=$(kubectl get pods -n default -l "app=hlf-ca,release=tlscaorg0" -o jsonpath="{.items[0].metadata.name}")

######## 2. Enrol tls-ca admin:
kubectl exec $POD_TLS_CA -- sh -c "fabric-ca-client enroll -d -u http://tls-ca-admin:tls-ca-adminPW@0.0.0.0:7054"

######## 3. Create secret for tls, used by ingress controller
# If there is pre-existing secret, tlscaorg0-tls , you need to remove it with:
# kubectl -n default delete secret tlscaorg0-tls
kubectl exec $POD_TLS_CA -- sh -c "mv ./Org0MSP/tls/server/msp/keystore/*_sk ./Org0MSP/tls/server/msp/keystore/key.pem"
export CERT=$(kubectl -n default exec ${POD_TLS_CA} -- cat ./Org0MSP/tls/server/ca-cert.pem)
export KEY=$(kubectl -n default exec ${POD_TLS_CA} -- cat ./Org0MSP/tls/server/msp/keystore/key.pem)
kubectl -n default create secret generic tlscaorg0-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"

######## 4. Register orderers:
kubectl -n default exec $POD_TLS_CA -- sh -c "fabric-ca-client register -d --id.name orderer0.org0.com --id.secret orderer0.org0.comPW --id.type orderer -u http://0.0.0.0:7054"
kubectl -n default exec $POD_TLS_CA -- sh -c "fabric-ca-client register -d --id.name orderer1.org0.com --id.secret orderer0.org0.comPW --id.type orderer -u http://0.0.0.0:7054"
kubectl -n default exec $POD_TLS_CA -- sh -c "fabric-ca-client register -d --id.name orderer2.org0.com --id.secret orderer0.org0.comPW --id.type orderer -u http://0.0.0.0:7054"
kubectl -n default exec $POD_TLS_CA -- sh -c "fabric-ca-client register -d --id.name orderer3.org0.com --id.secret orderer0.org0.comPW --id.type orderer -u http://0.0.0.0:7054"
kubectl -n default exec $POD_TLS_CA -- sh -c "fabric-ca-client register -d --id.name orderer4.org0.com --id.secret orderer0.org0.comPW --id.type orderer -u http://0.0.0.0:7054"

######## 5. Enrol tls-ca for orderer0
kubectl -n default exec $POD_TLS_CA -- sh -c "FABRIC_CA_CLIENT_MSPDIR=tls-msp FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org0MSP/orderer0.org0.com fabric-ca-client enroll -d -u http://orderer0.org0.com:orderer0.org0.comPW@0.0.0.0:7054 --enrollment.profile tls --csr.hosts orderer0-org0,127,0.0.1"
kubectl -n default exec $POD_TLS_CA -- sh -c "FABRIC_CA_CLIENT_MSPDIR=tls-msp FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org0MSP/orderer1.org0.com fabric-ca-client enroll -d -u http://orderer1.org0.com:orderer0.org0.comPW@0.0.0.0:7054 --enrollment.profile tls --csr.hosts orderer0-org0,127,0.0.1"
kubectl -n default exec $POD_TLS_CA -- sh -c "FABRIC_CA_CLIENT_MSPDIR=tls-msp FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org0MSP/orderer2.org0.com fabric-ca-client enroll -d -u http://orderer2.org0.com:orderer0.org0.comPW@0.0.0.0:7054 --enrollment.profile tls --csr.hosts orderer0-org0,127,0.0.1"
kubectl -n default exec $POD_TLS_CA -- sh -c "FABRIC_CA_CLIENT_MSPDIR=tls-msp FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org0MSP/orderer3.org0.com fabric-ca-client enroll -d -u http://orderer3.org0.com:orderer0.org0.comPW@0.0.0.0:7054 --enrollment.profile tls --csr.hosts orderer0-org0,127,0.0.1"
kubectl -n default exec $POD_TLS_CA -- sh -c "FABRIC_CA_CLIENT_MSPDIR=tls-msp FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org0MSP/orderer4.org0.com fabric-ca-client enroll -d -u http://orderer4.org0.com:orderer0.org0.comPW@0.0.0.0:7054 --enrollment.profile tls --csr.hosts orderer0-org0,127,0.0.1"
sleep 2

######## 6. Rename private key
kubectl -n default exec $POD_TLS_CA -- sh -c "cp ./Org0MSP/tls/admin/msp/cacerts/0-0-0-0-7054.pem ./Org0MSP/orderer0.org0.com/tls-ca-cert.pem"
kubectl -n default exec $POD_TLS_CA -- sh -c "cp ./Org0MSP/tls/admin/msp/cacerts/0-0-0-0-7054.pem ./Org0MSP/orderer1.org0.com/tls-ca-cert.pem"
kubectl -n default exec $POD_TLS_CA -- sh -c "cp ./Org0MSP/tls/admin/msp/cacerts/0-0-0-0-7054.pem ./Org0MSP/orderer2.org0.com/tls-ca-cert.pem"
kubectl -n default exec $POD_TLS_CA -- sh -c "cp ./Org0MSP/tls/admin/msp/cacerts/0-0-0-0-7054.pem ./Org0MSP/orderer3.org0.com/tls-ca-cert.pem"
kubectl -n default exec $POD_TLS_CA -- sh -c "cp ./Org0MSP/tls/admin/msp/cacerts/0-0-0-0-7054.pem ./Org0MSP/orderer4.org0.com/tls-ca-cert.pem"
sleep 2
kubectl -n default exec $POD_TLS_CA -- sh -c "mv ./Org0MSP/orderer0.org0.com/tls-msp/keystore/*_sk ./Org0MSP/orderer0.org0.com/tls-msp/keystore/key.pem"
kubectl -n default exec $POD_TLS_CA -- sh -c "mv ./Org0MSP/orderer1.org0.com/tls-msp/keystore/*_sk ./Org0MSP/orderer1.org0.com/tls-msp/keystore/key.pem"
kubectl -n default exec $POD_TLS_CA -- sh -c "mv ./Org0MSP/orderer2.org0.com/tls-msp/keystore/*_sk ./Org0MSP/orderer2.org0.com/tls-msp/keystore/key.pem"
kubectl -n default exec $POD_TLS_CA -- sh -c "mv ./Org0MSP/orderer3.org0.com/tls-msp/keystore/*_sk ./Org0MSP/orderer3.org0.com/tls-msp/keystore/key.pem"
kubectl -n default exec $POD_TLS_CA -- sh -c "mv ./Org0MSP/orderer4.org0.com/tls-msp/keystore/*_sk ./Org0MSP/orderer4.org0.com/tls-msp/keystore/key.pem"
