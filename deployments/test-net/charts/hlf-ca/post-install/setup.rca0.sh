#!/bin/bash
. ./scripts/setup.sh
######## post-install notes for rca0/hlf-ca
######## Objective: These steps:
######## - enroll rca0 ca admin
######## - create secret rca0-tls , secret for tls, using k8s convention
######## - register and enroll org0 org-admin
######## - register orderers -> rca0
######## - rename private keys
######## - prepare org admin and its admin-certs
########
######## 1. Get the name of the pod running rca:
export POD_RCA0=$(kubectl get pods -n n0 -l "app=hlf-ca,release=rca0" -o jsonpath="{.items[0].metadata.name}")
preventEmptyValue "pod unavailable" $POD_RCA0
######## 2. Enrol orderer's ca admin: rca-org0:
kubectl -n n0 exec $POD_RCA0 -- fabric-ca-client enroll -u http://rca0-admin:rca0-adminPW@0.0.0.0:7054
printMessage "enroll rca0-admin" $?
######## 3. Create secret for tls, used by ingress controller
# If there is pre-existing secret, rca0-tls , you need to remove it with:
# kubectl -n n0 delete secret rca0-tls
kubectl -n n0 exec $POD_RCA0 -- sh -c "mv ./Org0MSP/ca/server/msp/keystore/*_sk ./Org0MSP/ca/server/msp/keystore/key.pem"
export CERT=$(kubectl -n n0 exec ${POD_RCA0} -- cat ./Org0MSP/ca/server/ca-cert.pem)
preventEmptyValue "./Org0MSP/ca/server/ca-cert.pem" $CERT

export KEY=$(kubectl -n n0 exec ${POD_RCA0} -- cat ./Org0MSP/ca/server/msp/keystore/key.pem)
preventEmptyValue "./Org0MSP/ca/server/msp/keystore/key.pem" $KEY

kubectl -n n0 create secret generic rca0-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
printMessage "create secret rca0-tls" $?
######## 4. Register and enroll ordererMSP org admin:
kubectl -n n0 exec $POD_RCA0 -- sh -c "fabric-ca-client register --id.name admin-orderer0.org0.com --id.secret admin-orderer0.org0.comPW --id.type admin --id.attrs \"hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert\" -u http://0.0.0.0:7054 > /dev/null"
printMessage "register orgadmin admin-orderer0.org0.com" $?

kubectl -n n0 exec $POD_RCA0 -- sh -c "FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org0MSP/admin fabric-ca-client enroll -u http://admin-orderer0.org0.com:admin-orderer0.org0.comPW@0.0.0.0:7054"
printMessage "enroll orgadmin admin-orderer0.org0.com" $?

######## 5. Register orderer orderer0-org0
kubectl -n n0 exec $POD_RCA0 -- sh -c "fabric-ca-client register --id.name orderer0.org0.com --id.secret orderer0.org0.comPW --id.type orderer -u http://0.0.0.0:7054 > /dev/null"
printMessage "register peer orderer0.org0.com" $?
kubectl -n n0 exec $POD_RCA0 -- sh -c "fabric-ca-client register --id.name orderer1.org0.com --id.secret orderer1.org0.comPW --id.type orderer -u http://0.0.0.0:7054 > /dev/null"
printMessage "register peer orderer1.org0.com" $?
kubectl -n n0 exec $POD_RCA0 -- sh -c "fabric-ca-client register --id.name orderer2.org0.com --id.secret orderer2.org0.comPW --id.type orderer -u http://0.0.0.0:7054 > /dev/null"
printMessage "register peer orderer2.org0.com" $?
kubectl -n n0 exec $POD_RCA0 -- sh -c "fabric-ca-client register --id.name orderer3.org0.com --id.secret orderer3.org0.comPW --id.type orderer -u http://0.0.0.0:7054 > /dev/null"
printMessage "register peer orderer3.org0.com" $?
kubectl -n n0 exec $POD_RCA0 -- sh -c "fabric-ca-client register --id.name orderer4.org0.com --id.secret orderer4.org0.comPW --id.type orderer -u http://0.0.0.0:7054 > /dev/null"
printMessage "register peer orderer4.org0.com" $?
######## 6. Enroll orderer orderer0-org0
kubectl -n n0 exec $POD_RCA0 -- sh -c "FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org0MSP/orderer0.org0.com fabric-ca-client enroll -u http://orderer0.org0.com:orderer0.org0.comPW@0.0.0.0:7054"
printMessage "enroll peer orderer0.org0.com" $?
kubectl -n n0 exec $POD_RCA0 -- sh -c "FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org0MSP/orderer1.org0.com fabric-ca-client enroll -u http://orderer1.org0.com:orderer1.org0.comPW@0.0.0.0:7054"
printMessage "enroll peer orderer1.org0.com" $?
kubectl -n n0 exec $POD_RCA0 -- sh -c "FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org0MSP/orderer2.org0.com fabric-ca-client enroll -u http://orderer2.org0.com:orderer2.org0.comPW@0.0.0.0:7054"
printMessage "enroll peer orderer2.org0.com" $?
kubectl -n n0 exec $POD_RCA0 -- sh -c "FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org0MSP/orderer3.org0.com fabric-ca-client enroll -u http://orderer3.org0.com:orderer3.org0.comPW@0.0.0.0:7054"
printMessage "enroll peer orderer3.org0.com" $?
kubectl -n n0 exec $POD_RCA0 -- sh -c "FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org0MSP/orderer4.org0.com fabric-ca-client enroll -u http://orderer4.org0.com:orderer4.org0.comPW@0.0.0.0:7054"
printMessage "enroll peer orderer4.org0.com" $?
######## 7. Rename private key
kubectl -n n0 exec $POD_RCA0 -- sh -c "mv ./Org0MSP/orderer0.org0.com/msp/keystore/*_sk ./Org0MSP/orderer0.org0.com/msp/keystore/key.pem"
printMessage "rename private key ./Org0MSP/orderer0.org0.com/msp/keystore/*_sk" $?
kubectl -n n0 exec $POD_RCA0 -- sh -c "mv ./Org0MSP/orderer1.org0.com/msp/keystore/*_sk ./Org0MSP/orderer1.org0.com/msp/keystore/key.pem"
printMessage "rename private key ./Org0MSP/orderer1.org0.com/msp/keystore/*_sk" $?
kubectl -n n0 exec $POD_RCA0 -- sh -c "mv ./Org0MSP/orderer2.org0.com/msp/keystore/*_sk ./Org0MSP/orderer2.org0.com/msp/keystore/key.pem"
printMessage "rename private key ./Org0MSP/orderer2.org0.com/msp/keystore/*_sk" $?
kubectl -n n0 exec $POD_RCA0 -- sh -c "mv ./Org0MSP/orderer3.org0.com/msp/keystore/*_sk ./Org0MSP/orderer3.org0.com/msp/keystore/key.pem"
printMessage "rename private key ./Org0MSP/orderer3.org0.com/msp/keystore/*_sk" $?
kubectl -n n0 exec $POD_RCA0 -- sh -c "mv ./Org0MSP/orderer4.org0.com/msp/keystore/*_sk ./Org0MSP/orderer4.org0.com/msp/keystore/key.pem"
printMessage "rename private key ./Org0MSP/orderer4.org0.com/msp/keystore/*_sk" $?
sleep 1
kubectl -n n0 exec $POD_RCA0 -- sh -c "cp ./Org0MSP/ca/admin/msp/cacerts/0-0-0-0-7054.pem ./Org0MSP/orderer0.org0.com/org0.com-ca-cert.pem"
kubectl -n n0 exec $POD_RCA0 -- sh -c "cp ./Org0MSP/ca/admin/msp/cacerts/0-0-0-0-7054.pem ./Org0MSP/orderer1.org0.com/org0.com-ca-cert.pem"
kubectl -n n0 exec $POD_RCA0 -- sh -c "cp ./Org0MSP/ca/admin/msp/cacerts/0-0-0-0-7054.pem ./Org0MSP/orderer2.org0.com/org0.com-ca-cert.pem"
kubectl -n n0 exec $POD_RCA0 -- sh -c "cp ./Org0MSP/ca/admin/msp/cacerts/0-0-0-0-7054.pem ./Org0MSP/orderer3.org0.com/org0.com-ca-cert.pem"
kubectl -n n0 exec $POD_RCA0 -- sh -c "cp ./Org0MSP/ca/admin/msp/cacerts/0-0-0-0-7054.pem ./Org0MSP/orderer4.org0.com/org0.com-ca-cert.pem"
sleep 1

######## 8. Copy org0 admin cert
kubectl -n n0 exec $POD_RCA0 -- sh -c "mkdir -p ./Org0MSP/orderer0.org0.com/msp/admincerts"
kubectl -n n0 exec $POD_RCA0 -- sh -c "mkdir -p ./Org0MSP/orderer1.org0.com/msp/admincerts"
kubectl -n n0 exec $POD_RCA0 -- sh -c "mkdir -p ./Org0MSP/orderer2.org0.com/msp/admincerts"
kubectl -n n0 exec $POD_RCA0 -- sh -c "mkdir -p ./Org0MSP/orderer3.org0.com/msp/admincerts"
kubectl -n n0 exec $POD_RCA0 -- sh -c "mkdir -p ./Org0MSP/orderer4.org0.com/msp/admincerts"
sleep 1
kubectl -n n0 exec $POD_RCA0 -- sh -c "cp ./Org0MSP/admin/msp/signcerts/cert.pem ./Org0MSP/orderer0.org0.com/msp/admincerts/org0.com-admin-cert.pem"
printMessage "cp admin cert ./Org0MSP/admin/msp/signcerts/cert.pem" $?
kubectl -n n0 exec $POD_RCA0 -- sh -c "cp ./Org0MSP/admin/msp/signcerts/cert.pem ./Org0MSP/orderer1.org0.com/msp/admincerts/org0.com-admin-cert.pem"
printMessage "cp admin cert ./Org0MSP/admin/msp/signcerts/cert.pem" $?
kubectl -n n0 exec $POD_RCA0 -- sh -c "cp ./Org0MSP/admin/msp/signcerts/cert.pem ./Org0MSP/orderer2.org0.com/msp/admincerts/org0.com-admin-cert.pem"
printMessage "cp admin cert ./Org0MSP/admin/msp/signcerts/cert.pem" $?
kubectl -n n0 exec $POD_RCA0 -- sh -c "cp ./Org0MSP/admin/msp/signcerts/cert.pem ./Org0MSP/orderer3.org0.com/msp/admincerts/org0.com-admin-cert.pem"
printMessage "cp admin cert ./Org0MSP/admin/msp/signcerts/cert.pem" $?
kubectl -n n0 exec $POD_RCA0 -- sh -c "cp ./Org0MSP/admin/msp/signcerts/cert.pem ./Org0MSP/orderer4.org0.com/msp/admincerts/org0.com-admin-cert.pem"
printMessage "cp admin cert ./Org0MSP/admin/msp/signcerts/cert.pem" $?

######## 9. Create admincert from org admin cert
kubectl -n n0 exec $POD_RCA0 -- sh -c "mkdir -p ./Org0MSP/msp/admincerts"
kubectl -n n0 exec $POD_RCA0 -- sh -c "mkdir -p ./Org0MSP/msp/cacerts"
kubectl -n n0 exec $POD_RCA0 -- sh -c "mkdir -p ./Org0MSP/msp/tlscacerts"
kubectl -n n0 exec $POD_RCA0 -- sh -c "cp ./Org0MSP/orderer0.org0.com/msp/admincerts/org0.com-admin-cert.pem ./Org0MSP/msp/admincerts"
kubectl -n n0 exec $POD_RCA0 -- sh -c "cp ./Org0MSP/orderer0.org0.com/tls-ca-cert.pem ./Org0MSP/msp/tlscacerts"
kubectl -n n0 exec $POD_RCA0 -- sh -c "cp ./Org0MSP/orderer0.org0.com/org0.com-ca-cert.pem ./Org0MSP/msp/cacerts"
printMessage "create admin cert ./Org0MSP/orderer0.org0.com/org0.com-ca-cert.pem" $?
