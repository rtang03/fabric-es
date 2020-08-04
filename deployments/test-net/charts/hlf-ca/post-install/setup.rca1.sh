#!/bin/bash
######## post-install notes for rca1/hlf-ca
######## Objective: These steps:
######## - enroll rca0 ca admin
######## - create secret rcaorg1-tls , secret for tls, using k8s convention
######## - register and enroll org1 org-admin
######## - register and enroll peers -> rca0
######## - rename private keys
######## - prepare org admin and its admin-certs
########

######## 1. Get the name of the pod running rca:
export POD_RCA=$(kubectl get pods -n n1 -l "app=hlf-ca,release=rca1" -o jsonpath="{.items[0].metadata.name}")

######## 2. Enrol peer's ca admin: rca-org1:
kubectl -n n1 exec $POD_RCA -- fabric-ca-client enroll -d -u http://rca1-admin:rca1-adminPW@0.0.0.0:7054

######## 3. Create secret for tls, used by ingress controller
# If there is pre-existing secret, rca1-tls , you need to remove it with:
# kubectl -n n1 delete secret rcaorg1-tls
kubectl -n n1 exec $POD_RCA -- sh -c "mv ./Org1MSP/ca/server/msp/keystore/*_sk ./Org1MSP/ca/server/msp/keystore/key.pem"
export CERT=$(kubectl -n n1 exec ${POD_RCA} -- cat ./Org1MSP/ca/server/ca-cert.pem)
export KEY=$(kubectl -n n1 exec ${POD_RCA} -- cat ./Org1MSP/ca/server/msp/keystore/key.pem)
kubectl -n n1 create secret generic rcaorg1-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
######## 4. Register and enroll Org1MSP org admin:
kubectl -n n1 exec $POD_RCA -- sh -c "fabric-ca-client register -d --id.name admin-peer0.org1.net --id.secret admin-peer0.org1.netPW --id.type admin --id.attrs \"hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert\" -u http://0.0.0.0:7054"
kubectl -n n1 exec $POD_RCA -- sh -c "FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org1MSP/admin fabric-ca-client enroll -d -u http://admin-peer0.org1.net:admin-peer0.org1.netPW@0.0.0.0:7054"

######## 5. Register peer(s) for Org1MSP
kubectl -n n1 exec $POD_RCA -- sh -c "fabric-ca-client register -d --id.name peer0.org1.net --id.secret peer0.org1.netPW --id.type peer -u http://0.0.0.0:7054"

######## 6. Enroll peer(s) for Org1MSP
kubectl -n n1 exec $POD_RCA -- sh -c "FABRIC_CA_CLIENT_HOME=/var/hyperledger/crypto-config/Org1MSP/peer0.org1.net fabric-ca-client enroll -d -u http://peer0.org1.net:peer0.org1.netPW@0.0.0.0:7054"

######## 7. Rename private key
kubectl -n n1 exec $POD_RCA -- sh -c "mv ./Org1MSP/peer0.org1.net/msp/keystore/*_sk ./Org1MSP/peer0.org1.net/msp/keystore/key.pem"
sleep 1
kubectl -n n1 exec $POD_RCA -- sh -c "cp ./Org1MSP/ca/admin/msp/cacerts/0-0-0-0-7054.pem ./Org1MSP/peer0.org1.net/org1.net-ca-cert.pem"

######## 8. Copy admin cert
kubectl -n n1 exec $POD_RCA -- sh -c "mkdir -p ./Org1MSP/peer0.org1.net/msp/admincerts"
sleep 1
kubectl -n n1 exec $POD_RCA -- sh -c "cp ./Org1MSP/admin/msp/signcerts/cert.pem ./Org1MSP/peer0.org1.net/msp/admincerts/org1.net-admin-cert.pem"

######## 9. Create admincert from org admin cert
kubectl -n n1 exec $POD_RCA -- sh -c "mkdir -p ./Org1MSP/admin/msp/admincerts"
kubectl -n n1 exec $POD_RCA -- sh -c "mkdir -p ./Org1MSP/msp/admincerts"
kubectl -n n1 exec $POD_RCA -- sh -c "mkdir -p ./Org1MSP/msp/cacerts"
kubectl -n n1 exec $POD_RCA -- sh -c "mkdir -p ./Org1MSP/msp/tlscacerts"
kubectl -n n1 exec $POD_RCA -- sh -c "cp ./Org1MSP/peer0.org1.net/msp/admincerts/org1.net-admin-cert.pem ./Org1MSP/admin/msp/admincerts"
kubectl -n n1 exec $POD_RCA -- sh -c "cp ./Org1MSP/peer0.org1.net/msp/admincerts/org1.net-admin-cert.pem ./Org1MSP/msp/admincerts"
kubectl -n n1 exec $POD_RCA -- sh -c "cp ./Org1MSP/peer0.org1.net/tls-ca-cert.pem ./Org1MSP/msp/tlscacerts"
kubectl -n n1 exec $POD_RCA -- sh -c "cp ./Org1MSP/peer0.org1.net/org1.net-ca-cert.pem ./Org1MSP/msp/cacerts"
kubectl -n n1 exec $POD_RCA -- sh -c "mv ./Org1MSP/admin/msp/keystore/*_sk ./Org1MSP/admin/msp/keystore/key.pem"
