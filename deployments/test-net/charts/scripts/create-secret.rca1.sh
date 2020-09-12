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

echo "######## 2. secret: cert and key"
export CONTENT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/peer0.org1.net/msp/signcerts/cert.pem)
preventEmptyValue "./Org1MSP/peer0.org1.net/msp/signcerts/cert.pem" $CONTENT

kubectl -n n1 create secret generic peer0.org1.net-cert --from-literal=cert.pem="$CONTENT"
printMessage "create secret peer0.org1.net-cert" $?

export CONTENT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/peer0.org1.net/msp/keystore/key.pem)
preventEmptyValue "./Org1MSP/peer0.org1.net/msp/keystore/key.pem" $CONTENT

kubectl -n n1 create secret generic peer0.org1.net-key --from-literal=key.pem="$CONTENT"
printMessage "create secret peer0.org1.net-key" $?

echo "######## 3. secret: CA cert"
export CONTENT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/peer0.org1.net/msp/cacerts/rca1-hlf-ca-n1-svc-cluster-local-7054.pem)
preventEmptyValue "./Org1MSP/peer0.org1.net/msp/cacerts/rca1-hlf-ca-n1-svc-cluster-local-7054.pem" $CONTENT

kubectl -n n1 create secret generic peer0.org1.net-cacert --from-literal=cacert.pem="$CONTENT"
printMessage "create secret peer0.org1.net-cacert" $?

echo "######## 4. secret: tls cert and key"
export CERT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/peer0.org1.net/tls-msp/signcerts/cert.pem)
preventEmptyValue "./Org1MSP/peer0.org1.net/tls-msp/signcerts/cert.pem" $CONTENT

export KEY=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/peer0.org1.net/tls-msp/keystore/key.pem)
preventEmptyValue "./Org1MSP/peer0.org1.net/tls-msp/keystore/key.pem" $CONTENT

kubectl -n n1 create secret generic peer0.org1.net-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
printMessage "create secret peer0.org1.net-tls" $?

echo "######## 5. secret: tls root CA cert"
export CONTENT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-tlsca1-hlf-ca-n1-svc-cluster-local-7054.pem)
preventEmptyValue "./Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-tlsca1-hlf-ca-n1-svc-cluster-local-7054.pem" $CONTENT

kubectl -n n1 create secret generic peer0.org1.net-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
printMessage "create secret peer0.org1.net-tlsrootcert" $?

echo "######## 6. create secret for org1.net-admin-cert.pem"
export CONTENT=$(kubectl -n n1 exec $POD_RCA -- sh -c "cat ./Org1MSP/admin/msp/admincerts/org1.net-admin-cert.pem")
preventEmptyValue "./Org1MSP/admin/msp/admincerts/org1.net-admin-cert.pem" $CONTENT

kubectl -n n1 create secret generic peer0.org1.net-admincert --from-literal=org1.net-admin-cert.pem="$CONTENT"
printMessage "create secret peer0.org1.net-admincert" $?

echo "######## 7. create secret for org1.net-admin-key.pem"
export CONTENT=$(kubectl -n n1 exec $POD_RCA -- sh -c "cat ./Org1MSP/admin/msp/keystore/key.pem")
preventEmptyValue "./Org1MSP/admin/msp/keystore/key.pem" $CONTENT

kubectl -n n1 create secret generic peer0.org1.net-adminkey --from-literal=org1.net-admin-key.pem="$CONTENT"
printMessage "create secret peer0.org1.net-adminkey" $?

echo "######## 8. create secret org1.net-ca-cert.pem for Org0"
export CERT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/msp/cacerts/org1.net-ca-cert.pem)
preventEmptyValue "./Org1MSP/msp/cacerts/org1.net-ca-cert.pem" $CONTENT

kubectl -n n0 create secret generic org1-cacerts --from-literal=org1.net-ca-cert.pem="$CERT"
printMessage "create secret org1-cacerts" $?

echo "######## 9. create secret org1.net-admin-cert.pem for Org0"
export CERT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/msp/admincerts/org1.net-admin-cert.pem)
preventEmptyValue "./Org1MSP/msp/admincerts/org1.net-admin-cert.pem" $CONTENT

kubectl -n n0 create secret generic org1-admincerts --from-literal=org1.net-admin-cert.pem="$CERT"
printMessage "create secret org1-admincerts" $?

echo "######## 10. create secret org1.net-ca-cert.pem for Org0"
export CERT=$(kubectl -n n1 exec $POD_RCA -- cat ./Org1MSP/msp/tlscacerts/tls-ca-cert.pem)
preventEmptyValue "./Org1MSP/msp/tlscacerts/tls-ca-cert.pem" $CONTENT

kubectl -n n0 create secret generic org1-tlscacerts --from-literal=tls-ca-cert.pem="$CERT"
printMessage "create secret org1-tlscacerts" $?

echo "######## 11. Create secret for tls for tlsca, used by ingress controller"
export POD_TLSCA1=$(kubectl get pods -n n1 -l "app=hlf-ca,release=tlsca1" -o jsonpath="{.items[0].metadata.name}")
preventEmptyValue "pod unavailable" POD_TLSCA1

export CERT=$(kubectl -n n1 exec ${POD_TLSCA1} -- cat ./Org1MSP/tls/server/ca-cert.pem)
preventEmptyValue "./Org1MSP/tls/server/ca-cert.pem" $CERT

export KEY=$(kubectl -n n1 exec ${POD_TLSCA1} -- cat ./Org1MSP/tls/server/msp/keystore/key.pem)
preventEmptyValue "./Org1MSP/tls/server/msp/keystore/key.pem" $KEY

kubectl -n n1 create secret generic tlsca1-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
printMessage "create secret tlsca1-tls" $?

echo "######## 12. Create secret for tls for rca, used by ingress controller"
export CERT=$(kubectl -n n1 exec ${POD_RCA} -- cat ./Org1MSP/ca/server/ca-cert.pem)
preventEmptyValue "./Org1MSP/ca/server/ca-cert.pem" $CERT

export KEY=$(kubectl -n n1 exec ${POD_RCA} -- cat ./Org1MSP/ca/server/msp/keystore/key.pem)
preventEmptyValue "./Org1MSP/ca/server/msp/keystore/key.pem" $KEY

kubectl -n n1 create secret generic rcaorg1-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
printMessage "create secret rcaorg1-tls" $?
