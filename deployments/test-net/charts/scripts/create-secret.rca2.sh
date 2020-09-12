#!/bin/bash
. ./scripts/setup.sh
######## post-install notes for rca2/hlf-ca
######## Objective: These steps, create secret
######## - peer0.org2.net-cert peer0.org2.net-key
######## - peer0.org2.net-cacert peer0.org2.net-tls peer0.org2.net-tlsrootcert peer0.org2.net-admincert
######## - org2-cacerts
######## - org2-admincerts
######## - org2-tlscacerts
########
######## 1. secret: rca2-hlf-ca--ca is already set by secret manifest. Below command retrieves it.
# export CA_ADMIN=$(kubectl -n n2 get secret rca2-hlf-ca--ca -o jsonpath=".data.CA_ADMIN" | base64)
# export CA_PASSWORD=$(kubectl -n n2 get secret rca2-hlf-ca--ca -o jsonpath=".data.CA_PASSWORD" | base64)
echo "Get POD_RCA pod id"
export POD_RCA=$(kubectl get pods -n n2 -l "app=hlf-ca,release=rca2" -o jsonpath="{.items[0].metadata.name}")
preventEmptyValue "pod unavailable" $POD_RCA

echo "######## 2. secret: cert and key"
export CONTENT=$(kubectl -n n2 exec $POD_RCA -- cat ./Org2MSP/peer0.org2.net/msp/signcerts/cert.pem)
preventEmptyValue "./Org2MSP/peer0.org2.net/msp/signcerts/cert.pem" $CONTENT

kubectl -n n2 create secret generic peer0.org2.net-cert --from-literal=cert.pem="$CONTENT"
printMessage "create secret peer0.org2.net-cert" $?

export CONTENT=$(kubectl -n n2 exec $POD_RCA -- cat ./Org2MSP/peer0.org2.net/msp/keystore/key.pem)
preventEmptyValue "./Org2MSP/peer0.org2.net/msp/keystore/key.pem" $CONTENT

kubectl -n n2 create secret generic peer0.org2.net-key --from-literal=key.pem="$CONTENT"
printMessage "create secret peer0.org2.net-key" $?

echo "######## 3. secret: CA cert"
export CONTENT=$(kubectl -n n2 exec $POD_RCA -- cat ./Org2MSP/peer0.org2.net/msp/cacerts/rca2-hlf-ca-n2-svc-cluster-local-7054.pem)
preventEmptyValue "./Org2MSP/peer0.org2.net/msp/cacerts/rca2-hlf-ca-n2-svc-cluster-local-7054.pem" $CONTENT

kubectl -n n2 create secret generic peer0.org2.net-cacert --from-literal=cacert.pem="$CONTENT"
printMessage "create secret peer0.org2.net-cacert" $?

echo "######## 4. secret: tls cert and key"
export CERT=$(kubectl -n n2 exec $POD_RCA -- cat ./Org2MSP/peer0.org2.net/tls-msp/signcerts/cert.pem)
preventEmptyValue "./Org2MSP/peer0.org2.net/tls-msp/signcerts/cert.pem" $CONTENT

export KEY=$(kubectl -n n2 exec $POD_RCA -- cat ./Org2MSP/peer0.org2.net/tls-msp/keystore/key.pem)
preventEmptyValue "./Org2MSP/peer0.org2.net/tls-msp/keystore/key.pem" $CONTENT

kubectl -n n2 create secret generic peer0.org2.net-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
printMessage "create secret peer0.org2.net-tls" $?

echo "######## 5. secret: tls root CA cert"
export CONTENT=$(kubectl -n n2 exec $POD_RCA -- cat ./Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-tlsca2-hlf-ca-n2-svc-cluster-local-7054.pem)
preventEmptyValue "./Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-tlsca2-hlf-ca-n2-svc-cluster-local-7054.pem" $CONTENT

kubectl -n n2 create secret generic peer0.org2.net-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
printMessage "create secret peer0.org2.net-tlsrootcert" $?

echo "######## 6. create secret for org2.net-admin-cert.pem"
export CONTENT=$(kubectl -n n2 exec $POD_RCA -- sh -c "cat ./Org2MSP/admin/msp/admincerts/org2.net-admin-cert.pem")
preventEmptyValue "./Org2MSP/admin/msp/admincerts/org2.net-admin-cert.pem" $CONTENT

kubectl -n n2 create secret generic peer0.org2.net-admincert --from-literal=org2.net-admin-cert.pem="$CONTENT"
printMessage "create secret peer0.org2.net-admincert" $?

echo "######## 7. create secret for org2.net-admin-key.pem"
export CONTENT=$(kubectl -n n2 exec $POD_RCA -- sh -c "cat ./Org2MSP/admin/msp/keystore/key.pem")
preventEmptyValue "./Org2MSP/admin/msp/keystore/key.pem" $CONTENT

kubectl -n n2 create secret generic peer0.org2.net-adminkey --from-literal=org2.net-admin-key.pem="$CONTENT"
printMessage "create secret peer0.org2.net-adminkey" $?

echo "######## 8. Create secret for tls for tlsca, used by ingress controller"
export POD_TLSCA2=$(kubectl get pods -n n2 -l "app=hlf-ca,release=tlsca2" -o jsonpath="{.items[0].metadata.name}")
preventEmptyValue "pod unavailable" POD_TLSCA2

export CERT=$(kubectl -n n2 exec ${POD_TLSCA2} -- cat ./Org2MSP/tls/server/ca-cert.pem)
preventEmptyValue "./Org2MSP/tls/server/ca-cert.pem" $CERT

export KEY=$(kubectl -n n2 exec ${POD_TLSCA2} -- cat ./Org2MSP/tls/server/msp/keystore/key.pem)
preventEmptyValue "./Org2MSP/tls/server/msp/keystore/key.pem" $KEY

kubectl -n n2 create secret generic tlsca2-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
printMessage "create secret tlsca2-tls" $?

echo "######## 9. Create secret for tls for rca, used by ingress controller"
export CERT=$(kubectl -n n2 exec ${POD_RCA} -- cat ./Org2MSP/ca/server/ca-cert.pem)
preventEmptyValue "./Org2MSP/ca/server/ca-cert.pem" $CERT

export KEY=$(kubectl -n n2 exec ${POD_RCA} -- cat ./Org2MSP/ca/server/msp/keystore/key.pem)
preventEmptyValue "./Org2MSP/ca/server/msp/keystore/key.pem" $KEY

kubectl -n n2 create secret generic rcaorg2-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
printMessage "create secret rcaorg2-tls" $?

################################## USED FOR n0 ##################################
######## 10. create secret org2.net-ca-cert.pem for Org0
#export CERT=$(kubectl -n n2 exec $POD_RCA -- cat ./Org2MSP/msp/cacerts/org2.net-ca-cert.pem)
#preventEmptyValue "./Org2MSP/msp/cacerts/org2.net-ca-cert.pem" $CONTENT
#
#kubectl -n n0 create secret generic org2-cacerts --from-literal=org2.net-ca-cert.pem="$CERT"
#printMessage "create secret org2-cacerts" $?
#
######### 11. create secret org2.net-admin-cert.pem for Org0
#export CERT=$(kubectl -n n2 exec $POD_RCA -- cat ./Org2MSP/msp/admincerts/org2.net-admin-cert.pem)
#preventEmptyValue "./Org2MSP/msp/admincerts/org2.net-admin-cert.pem" $CONTENT
#
#kubectl -n n0 create secret generic org2-admincerts --from-literal=org2.net-admin-cert.pem="$CERT"
#printMessage "create secret org2-admincerts" $?
#
######### 12. create secret org2.net-ca-cert.pem for Org0
#export CERT=$(kubectl -n n2 exec $POD_RCA -- cat ./Org2MSP/msp/tlscacerts/tls-ca-cert.pem)
#preventEmptyValue "./Org2MSP/msp/tlscacerts/tls-ca-cert.pem" $CONTENT
#
#kubectl -n n0 create secret generic org2-tlscacerts --from-literal=tls-ca-cert.pem="$CERT"
#printMessage "create secret org2-tlscacerts" $?
#
######### 13. orderer0 tlsrootcert for n2
#export POD_RCA0=$(kubectl get pods -n n0 -l "app=hlf-ca,release=rca0" -o jsonpath="{.items[0].metadata.name}")
#preventEmptyValue "pod unavailable" $POD_RCA0
#
#export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer0.org0.com/tls-msp/tlscacerts/tls-tlsca0-hlf-ca-n0-svc-cluster-local-7054.pem)
#preventEmptyValue "./Org0MSP/orderer0.org0.com/tls-msp/tlscacerts/tls-tlsca0-hlf-ca-n0-svc-cluster-local-7054.pem" $CONTENT
#
#kubectl -n n2 create secret generic orderer0.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
#printMessage "create secret orderer0.org0.com-tlsrootcert" $?
#
####
#
######### 14. orderer0 tlssigncert for n2
#export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer0.org0.com/tls-msp/signcerts/cert.pem)
#preventEmptyValue "./Org0MSP/orderer0.org0.com/tls-msp/signcerts/cert.pem" $CONTENT
#
#kubectl -n n2 create secret generic orderer0.org0.com-tlssigncert --from-literal=cert.pem="$CONTENT"
#printMessage "create secret orderer0.org0.com-tlssigncert" $?

######### 15. create secret for org0-tls-ca-cert
#export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- sh -c "cat ./Org0MSP/msp/tlscacerts/tls-ca-cert.pem")
#preventEmptyValue "./Org0MSP/msp/tlscacerts/tls-ca-cert.pem" $CONTENT
#
#kubectl -n n2 create secret generic org0-tls-ca-cert --from-literal=tlscacert.pem="$CONTENT"
#printMessage "create secret org0-tls-ca-cert" $?
