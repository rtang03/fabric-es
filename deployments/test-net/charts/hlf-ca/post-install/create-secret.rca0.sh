#!/bin/bash
######## post-install notes for rca0/hlf-ca
######## Objective: These steps, create secret
######## - orderer0.org0.com-cert orderer0.org0.com-key
######## - orderer0.org0.com-cacert orderer0.org0.com-tls orderer0.org0.com-tlsrootcert orderer0.org0.com-admincert
######## - orderer1.org0.com-cert orderer1.org0.com-key
######## - orderer1.org0.com-cacert orderer1.org0.com-tls orderer1.org0.com-tlsrootcert orderer1.org0.com-admincert
######## - orderer2.org0.com-cert orderer2.org0.com-key
######## - orderer2.org0.com-cacert orderer2.org0.com-tls orderer2.org0.com-tlsrootcert orderer2.org0.com-admincert
######## - orderer3.org0.com-cert orderer3.org0.com-key
######## - orderer3.org0.com-cacert orderer3.org0.com-tls orderer3.org0.com-tlsrootcert orderer3.org0.com-admincert
######## - orderer4.org0.com-cert orderer4.org0.com-key
######## - orderer4.org0.com-cacert orderer4.org0.com-tls orderer4.org0.com-tlsrootcert orderer4.org0.com-admincert
########
######## 1. secret: rca0-hlf-ca--ca is already set by secret manifest. Below command retrieves it.
# export CA_ADMIN=$(kubectl -n n0 get secret rca0-hlf-ca--ca -o jsonpath=".data.CA_ADMIN" | base64 -d)
# export CA_PASSWORD=$(kubectl -n n0 get secret rca0-hlf-ca--ca -o jsonpath=".data.CA_PASSWORD" | base64 -d)
export POD_RCA0=$(kubectl get pods -n n0 -l "app=hlf-ca,release=rca0" -o jsonpath="{.items[0].metadata.name}")

######## 2. secret: cert and key
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer0.org0.com/msp/signcerts/cert.pem)
kubectl -n n0 create secret generic orderer0.org0.com-cert --from-literal=cert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer0.org0.com/msp/keystore/key.pem)
kubectl -n n0 create secret generic orderer0.org0.com-key --from-literal=key.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer1.org0.com/msp/signcerts/cert.pem)
kubectl -n n0 create secret generic orderer1.org0.com-cert --from-literal=cert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer1.org0.com/msp/keystore/key.pem)
kubectl -n n0 create secret generic orderer1.org0.com-key --from-literal=key.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer2.org0.com/msp/signcerts/cert.pem)
kubectl -n n0 create secret generic orderer2.org0.com-cert --from-literal=cert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer2.org0.com/msp/keystore/key.pem)
kubectl -n n0 create secret generic orderer2.org0.com-key --from-literal=key.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer3.org0.com/msp/signcerts/cert.pem)
kubectl -n n0 create secret generic orderer3.org0.com-cert --from-literal=cert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer3.org0.com/msp/keystore/key.pem)
kubectl -n n0 create secret generic orderer3.org0.com-key --from-literal=key.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer4.org0.com/msp/signcerts/cert.pem)
kubectl -n n0 create secret generic orderer4.org0.com-cert --from-literal=cert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer4.org0.com/msp/keystore/key.pem)
kubectl -n n0 create secret generic orderer4.org0.com-key --from-literal=key.pem="$CONTENT"

######## 3. secret: CA cert
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer0.org0.com/msp/cacerts/0-0-0-0-7054.pem)
kubectl -n n0 create secret generic orderer0.org0.com-cacert --from-literal=cacert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer1.org0.com/msp/cacerts/0-0-0-0-7054.pem)
kubectl -n n0 create secret generic orderer1.org0.com-cacert --from-literal=cacert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer2.org0.com/msp/cacerts/0-0-0-0-7054.pem)
kubectl -n n0 create secret generic orderer2.org0.com-cacert --from-literal=cacert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer3.org0.com/msp/cacerts/0-0-0-0-7054.pem)
kubectl -n n0 create secret generic orderer3.org0.com-cacert --from-literal=cacert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer4.org0.com/msp/cacerts/0-0-0-0-7054.pem)
kubectl -n n0 create secret generic orderer4.org0.com-cacert --from-literal=cacert.pem="$CONTENT"

######## 4. secret: tls cert and key
export CERT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer0.org0.com/tls-msp/signcerts/cert.pem)
export KEY=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer0.org0.com/tls-msp/keystore/key.pem)
kubectl -n n0 create secret generic orderer0.org0.com-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
export CERT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer1.org0.com/tls-msp/signcerts/cert.pem)
export KEY=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer1.org0.com/tls-msp/keystore/key.pem)
kubectl -n n0 create secret generic orderer1.org0.com-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
export CERT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer2.org0.com/tls-msp/signcerts/cert.pem)
export KEY=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer2.org0.com/tls-msp/keystore/key.pem)
kubectl -n n0 create secret generic orderer2.org0.com-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
export CERT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer3.org0.com/tls-msp/signcerts/cert.pem)
export KEY=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer3.org0.com/tls-msp/keystore/key.pem)
kubectl -n n0 create secret generic orderer3.org0.com-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
export CERT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer4.org0.com/tls-msp/signcerts/cert.pem)
export KEY=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer4.org0.com/tls-msp/keystore/key.pem)
kubectl -n n0 create secret generic orderer4.org0.com-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"

######## 5. secret: tls root CA cert for both n0 and n1
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer0.org0.com/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem)
kubectl -n n0 create secret generic orderer0.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
kubectl -n n1 create secret generic orderer0.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer1.org0.com/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem)
kubectl -n n0 create secret generic orderer1.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
kubectl -n n1 create secret generic orderer1.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer2.org0.com/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem)
kubectl -n n0 create secret generic orderer2.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
kubectl -n n1 create secret generic orderer2.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer3.org0.com/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem)
kubectl -n n0 create secret generic orderer3.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
kubectl -n n1 create secret generic orderer3.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer4.org0.com/tls-msp/tlscacerts/tls-0-0-0-0-7054.pem)
kubectl -n n0 create secret generic orderer4.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
kubectl -n n1 create secret generic orderer4.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"

######## 6. create secret for org0.com-admin-cert.pem
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- sh -c "cat ./Org0MSP/orderer0.org0.com/msp/admincerts/*.pem")
kubectl -n n0 create secret generic orderer0.org0.com-admincert --from-literal=org0.com-admin-cert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- sh -c "cat ./Org0MSP/orderer1.org0.com/msp/admincerts/*.pem")
kubectl -n n0 create secret generic orderer1.org0.com-admincert --from-literal=org0.com-admin-cert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- sh -c "cat ./Org0MSP/orderer2.org0.com/msp/admincerts/*.pem")
kubectl -n n0 create secret generic orderer2.org0.com-admincert --from-literal=org0.com-admin-cert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- sh -c "cat ./Org0MSP/orderer3.org0.com/msp/admincerts/*.pem")
kubectl -n n0 create secret generic orderer3.org0.com-admincert --from-literal=org0.com-admin-cert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- sh -c "cat ./Org0MSP/orderer4.org0.com/msp/admincerts/*.pem")
kubectl -n n0 create secret generic orderer4.org0.com-admincert --from-literal=org0.com-admin-cert.pem="$CONTENT"

######## 7. create secret from orderer's public cert, for use by peers
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer0.org0.com/tls-msp/signcerts/cert.pem)
kubectl -n n1 create secret generic orderer0.org0.com-tlssigncert --from-literal=cert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer1.org0.com/tls-msp/signcerts/cert.pem)
kubectl -n n1 create secret generic orderer1.org0.com-tlssigncert --from-literal=cert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer2.org0.com/tls-msp/signcerts/cert.pem)
kubectl -n n1 create secret generic orderer2.org0.com-tlssigncert --from-literal=cert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer3.org0.com/tls-msp/signcerts/cert.pem)
kubectl -n n1 create secret generic orderer3.org0.com-tlssigncert --from-literal=cert.pem="$CONTENT"
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer4.org0.com/tls-msp/signcerts/cert.pem)
kubectl -n n1 create secret generic orderer4.org0.com-tlssigncert --from-literal=cert.pem="$CONTENT"
