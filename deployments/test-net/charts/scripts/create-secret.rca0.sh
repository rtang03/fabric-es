#!/bin/bash
. ./scripts/setup.sh
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
# export CA_ADMIN=$(kubectl -n n0 get secret rca0-hlf-ca--ca -o jsonpath=".data.CA_ADMIN" | base64)
# export CA_PASSWORD=$(kubectl -n n0 get secret rca0-hlf-ca--ca -o jsonpath=".data.CA_PASSWORD" | base64)
export POD_RCA0=$(kubectl get pods -n n0 -l "app=hlf-ca,release=rca0" -o jsonpath="{.items[0].metadata.name}")
preventEmptyValue "pod unavailable" $POD_RCA0
######## 2. secret: cert and key
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer0.org0.com/msp/signcerts/cert.pem)
preventEmptyValue "./Org0MSP/orderer0.org0.com/msp/signcerts/cert.pem" $CONTENT

kubectl -n n0 create secret generic orderer0.org0.com-cert --from-literal=cert.pem="$CONTENT"
printMessage "create secret orderer0.org0.com-cert" $?

export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer0.org0.com/msp/keystore/key.pem)
preventEmptyValue "./Org0MSP/orderer0.org0.com/msp/keystore/key.pem" $CONTENT

kubectl -n n0 create secret generic orderer0.org0.com-key --from-literal=key.pem="$CONTENT"
printMessage "create secret orderer0.org0.com-key" $?
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer1.org0.com/msp/signcerts/cert.pem)
preventEmptyValue "./Org0MSP/orderer1.org0.com/msp/signcerts/cert.pem" $CONTENT

kubectl -n n0 create secret generic orderer1.org0.com-cert --from-literal=cert.pem="$CONTENT"
printMessage "create secret orderer1.org0.com-cert" $?

export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer1.org0.com/msp/keystore/key.pem)
preventEmptyValue "./Org0MSP/orderer1.org0.com/msp/keystore/key.pem" $CONTENT

kubectl -n n0 create secret generic orderer1.org0.com-key --from-literal=key.pem="$CONTENT"
printMessage "create secret orderer1.org0.com-key" $?
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer2.org0.com/msp/signcerts/cert.pem)
preventEmptyValue "./Org0MSP/orderer2.org0.com/msp/signcerts/cert.pem" $CONTENT

kubectl -n n0 create secret generic orderer2.org0.com-cert --from-literal=cert.pem="$CONTENT"
printMessage "create secret orderer2.org0.com-cert" $?

export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer2.org0.com/msp/keystore/key.pem)
preventEmptyValue "./Org0MSP/orderer2.org0.com/msp/keystore/key.pem" $CONTENT

kubectl -n n0 create secret generic orderer2.org0.com-key --from-literal=key.pem="$CONTENT"
printMessage "create secret orderer2.org0.com-key" $?
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer3.org0.com/msp/signcerts/cert.pem)
preventEmptyValue "./Org0MSP/orderer3.org0.com/msp/signcerts/cert.pem" $CONTENT

kubectl -n n0 create secret generic orderer3.org0.com-cert --from-literal=cert.pem="$CONTENT"
printMessage "create secret orderer3.org0.com-cert" $?

export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer3.org0.com/msp/keystore/key.pem)
preventEmptyValue "./Org0MSP/orderer3.org0.com/msp/keystore/key.pem" $CONTENT

kubectl -n n0 create secret generic orderer3.org0.com-key --from-literal=key.pem="$CONTENT"
printMessage "create secret orderer3.org0.com-key" $?
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer4.org0.com/msp/signcerts/cert.pem)
preventEmptyValue "./Org0MSP/orderer4.org0.com/msp/signcerts/cert.pem" $CONTENT

kubectl -n n0 create secret generic orderer4.org0.com-cert --from-literal=cert.pem="$CONTENT"
printMessage "create secret orderer4.org0.com-cert" $?

export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer4.org0.com/msp/keystore/key.pem)
preventEmptyValue "./Org0MSP/orderer4.org0.com/msp/keystore/key.pem" $CONTENT

kubectl -n n0 create secret generic orderer4.org0.com-key --from-literal=key.pem="$CONTENT"
printMessage "create secret orderer4.org0.com-key" $?

######## 3. secret: CA cert
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer0.org0.com/msp/cacerts/rca0-hlf-ca-n0-svc-cluster-local-7054.pem)
preventEmptyValue "./Org0MSP/orderer0.org0.com/msp/cacerts/rca0-hlf-ca-n0-svc-cluster-local-7054.pem" $CONTENT

kubectl -n n0 create secret generic orderer0.org0.com-cacert --from-literal=cacert.pem="$CONTENT"
printMessage "create secret orderer0.org0.com-cacert" $?
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer1.org0.com/msp/cacerts/rca0-hlf-ca-n0-svc-cluster-local-7054.pem)
preventEmptyValue "./Org0MSP/orderer1.org0.com/msp/cacerts/rca0-hlf-ca-n0-svc-cluster-local-7054.pem" $CONTENT

kubectl -n n0 create secret generic orderer1.org0.com-cacert --from-literal=cacert.pem="$CONTENT"
printMessage "create secret orderer1.org0.com-cacert" $?
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer2.org0.com/msp/cacerts/rca0-hlf-ca-n0-svc-cluster-local-7054.pem)
preventEmptyValue "./Org0MSP/orderer2.org0.com/msp/cacerts/rca0-hlf-ca-n0-svc-cluster-local-7054.pem" $CONTENT

kubectl -n n0 create secret generic orderer2.org0.com-cacert --from-literal=cacert.pem="$CONTENT"
printMessage "create secret orderer2.org0.com-cacert" $?
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer3.org0.com/msp/cacerts/rca0-hlf-ca-n0-svc-cluster-local-7054.pem)
preventEmptyValue "./Org0MSP/orderer3.org0.com/msp/cacerts/rca0-hlf-ca-n0-svc-cluster-local-7054.pem" $CONTENT

kubectl -n n0 create secret generic orderer3.org0.com-cacert --from-literal=cacert.pem="$CONTENT"
printMessage "create secret orderer3.org0.com-cacert" $?
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer4.org0.com/msp/cacerts/rca0-hlf-ca-n0-svc-cluster-local-7054.pem)
preventEmptyValue "./Org0MSP/orderer4.org0.com/msp/cacerts/rca0-hlf-ca-n0-svc-cluster-local-7054.pem" $CONTENT

kubectl -n n0 create secret generic orderer4.org0.com-cacert --from-literal=cacert.pem="$CONTENT"
printMessage "create secret orderer4.org0.com-cacert" $?

######## 4. secret: tls cert and key
export CERT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer0.org0.com/tls-msp/signcerts/cert.pem)
preventEmptyValue "./Org0MSP/orderer0.org0.com/tls-msp/signcerts/cert.pem" $CONTENT

export KEY=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer0.org0.com/tls-msp/keystore/key.pem)
preventEmptyValue "./Org0MSP/orderer0.org0.com/tls-msp/keystore/key.pem" $CONTENT

kubectl -n n0 create secret generic orderer0.org0.com-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
printMessage "create secret orderer0.org0.com-tls" $?
export CERT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer1.org0.com/tls-msp/signcerts/cert.pem)
preventEmptyValue "./Org0MSP/orderer1.org0.com/tls-msp/signcerts/cert.pem" $CONTENT

export KEY=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer1.org0.com/tls-msp/keystore/key.pem)
preventEmptyValue "./Org0MSP/orderer1.org0.com/tls-msp/keystore/key.pem" $CONTENT

kubectl -n n0 create secret generic orderer1.org0.com-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
printMessage "create secret orderer1.org0.com-tls" $?
export CERT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer2.org0.com/tls-msp/signcerts/cert.pem)
preventEmptyValue "./Org0MSP/orderer2.org0.com/tls-msp/signcerts/cert.pem" $CONTENT

export KEY=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer2.org0.com/tls-msp/keystore/key.pem)
preventEmptyValue "./Org0MSP/orderer2.org0.com/tls-msp/keystore/key.pem" $CONTENT

kubectl -n n0 create secret generic orderer2.org0.com-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
printMessage "create secret orderer2.org0.com-tls" $?
export CERT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer3.org0.com/tls-msp/signcerts/cert.pem)
preventEmptyValue "./Org0MSP/orderer3.org0.com/tls-msp/signcerts/cert.pem" $CONTENT

export KEY=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer3.org0.com/tls-msp/keystore/key.pem)
preventEmptyValue "./Org0MSP/orderer3.org0.com/tls-msp/keystore/key.pem" $CONTENT

kubectl -n n0 create secret generic orderer3.org0.com-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
printMessage "create secret orderer3.org0.com-tls" $?
export CERT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer4.org0.com/tls-msp/signcerts/cert.pem)
preventEmptyValue "./Org0MSP/orderer4.org0.com/tls-msp/signcerts/cert.pem" $CONTENT

export KEY=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer4.org0.com/tls-msp/keystore/key.pem)
preventEmptyValue "./Org0MSP/orderer4.org0.com/tls-msp/keystore/key.pem" $CONTENT

kubectl -n n0 create secret generic orderer4.org0.com-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
printMessage "create secret orderer4.org0.com-tls" $?

######## 5. secret: tls root CA cert for both n0 and n1
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer0.org0.com/tls-msp/tlscacerts/tls-tlsca0-hlf-ca-n0-svc-cluster-local-7054.pem)
preventEmptyValue "./Org0MSP/orderer0.org0.com/tls-msp/tlscacerts/tls-tlsca0-hlf-ca-n0-svc-cluster-local-7054.pem" $CONTENT

kubectl -n n0 create secret generic orderer0.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
printMessage "create secret orderer0.org0.com-tlsrootcert for n0" $?

kubectl -n n1 create secret generic orderer0.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
printMessage "create secret orderer0.org0.com-tlsrootcert for n1" $?
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer1.org0.com/tls-msp/tlscacerts/tls-tlsca0-hlf-ca-n0-svc-cluster-local-7054.pem)
preventEmptyValue "./Org0MSP/orderer1.org0.com/tls-msp/tlscacerts/tls-tlsca0-hlf-ca-n0-svc-cluster-local-7054.pem" $CONTENT

kubectl -n n0 create secret generic orderer1.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
printMessage "create secret orderer1.org0.com-tlsrootcert for n0" $?

kubectl -n n1 create secret generic orderer1.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
printMessage "create secret orderer1.org0.com-tlsrootcert for n1" $?

export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer2.org0.com/tls-msp/tlscacerts/tls-tlsca0-hlf-ca-n0-svc-cluster-local-7054.pem)
preventEmptyValue "./Org0MSP/orderer2.org0.com/tls-msp/tlscacerts/tls-tlsca0-hlf-ca-n0-svc-cluster-local-7054.pem" $CONTENT

kubectl -n n0 create secret generic orderer2.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
printMessage "create secret orderer2.org0.com-tlsrootcert for n0" $?

kubectl -n n1 create secret generic orderer2.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
printMessage "create secret orderer2.org0.com-tlsrootcert for n1" $?

export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer3.org0.com/tls-msp/tlscacerts/tls-tlsca0-hlf-ca-n0-svc-cluster-local-7054.pem)
preventEmptyValue "./Org0MSP/orderer3.org0.com/tls-msp/tlscacerts/tls-tlsca0-hlf-ca-n0-svc-cluster-local-7054.pem" $CONTENT

kubectl -n n0 create secret generic orderer3.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
printMessage "create secret orderer3.org0.com-tlsrootcert for n0" $?

kubectl -n n1 create secret generic orderer3.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
printMessage "create secret orderer3.org0.com-tlsrootcert for n1" $?

export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer4.org0.com/tls-msp/tlscacerts/tls-tlsca0-hlf-ca-n0-svc-cluster-local-7054.pem)
preventEmptyValue "./Org0MSP/orderer4.org0.com/tls-msp/tlscacerts/tls-tlsca0-hlf-ca-n0-svc-cluster-local-7054.pem" $CONTENT

kubectl -n n0 create secret generic orderer4.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
printMessage "create secret orderer4.org0.com-tlsrootcert for n0" $?

kubectl -n n1 create secret generic orderer4.org0.com-tlsrootcert --from-literal=tlscacert.pem="$CONTENT"
printMessage "create secret orderer4.org0.com-tlsrootcert for n1" $?

######## 6. create secret for org0.com-admin-cert.pem
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- sh -c "cat ./Org0MSP/orderer0.org0.com/msp/admincerts/org0.com-admin-cert.pem")
preventEmptyValue "./Org0MSP/orderer0.org0.com/msp/admincerts/org0.com-admin-cert.pem" $CONTENT

kubectl -n n0 create secret generic orderer0.org0.com-admincert --from-literal=org0.com-admin-cert.pem="$CONTENT"
printMessage "create secret orderer0.org0.com-admincert" $?

export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- sh -c "cat ./Org0MSP/orderer1.org0.com/msp/admincerts/org0.com-admin-cert.pem")
preventEmptyValue "./Org0MSP/orderer1.org0.com/msp/admincerts/org0.com-admin-cert.pem" $CONTENT

kubectl -n n0 create secret generic orderer1.org0.com-admincert --from-literal=org0.com-admin-cert.pem="$CONTENT"
printMessage "create secret orderer1.org0.com-admincert" $?

export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- sh -c "cat ./Org0MSP/orderer2.org0.com/msp/admincerts/org0.com-admin-cert.pem")
preventEmptyValue "./Org0MSP/orderer2.org0.com/msp/admincerts/org0.com-admin-cert.pem" $CONTENT

kubectl -n n0 create secret generic orderer2.org0.com-admincert --from-literal=org0.com-admin-cert.pem="$CONTENT"
printMessage "create secret orderer2.org0.com-admincert" $?

export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- sh -c "cat ./Org0MSP/orderer3.org0.com/msp/admincerts/org0.com-admin-cert.pem")
preventEmptyValue "./Org0MSP/orderer3.org0.com/msp/admincerts/org0.com-admin-cert.pem" $CONTENT

kubectl -n n0 create secret generic orderer3.org0.com-admincert --from-literal=org0.com-admin-cert.pem="$CONTENT"
printMessage "create secret orderer3.org0.com-admincert" $?

export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- sh -c "cat ./Org0MSP/orderer4.org0.com/msp/admincerts/org0.com-admin-cert.pem")
preventEmptyValue "./Org0MSP/orderer4.org0.com/msp/admincerts/org0.com-admin-cert.pem" $CONTENT

kubectl -n n0 create secret generic orderer4.org0.com-admincert --from-literal=org0.com-admin-cert.pem="$CONTENT"
printMessage "create secret orderer4.org0.com-admincert" $?

######## 7. create secret from orderer's public cert, for use by peers
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer0.org0.com/tls-msp/signcerts/cert.pem)
preventEmptyValue "./Org0MSP/orderer0.org0.com/tls-msp/signcerts/cert.pem" $CONTENT

kubectl -n n1 create secret generic orderer0.org0.com-tlssigncert --from-literal=cert.pem="$CONTENT"
printMessage "create secret orderer0.org0.com-tlssigncert" $?

export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer1.org0.com/tls-msp/signcerts/cert.pem)
preventEmptyValue "./Org0MSP/orderer1.org0.com/tls-msp/signcerts/cert.pem" $CONTENT

kubectl -n n1 create secret generic orderer1.org0.com-tlssigncert --from-literal=cert.pem="$CONTENT"
printMessage "create secret orderer1.org0.com-tlssigncert" $?

export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer2.org0.com/tls-msp/signcerts/cert.pem)
preventEmptyValue "./Org0MSP/orderer2.org0.com/tls-msp/signcerts/cert.pem" $CONTENT

kubectl -n n1 create secret generic orderer2.org0.com-tlssigncert --from-literal=cert.pem="$CONTENT"
printMessage "create secret orderer2.org0.com-tlssigncert" $?

export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer3.org0.com/tls-msp/signcerts/cert.pem)
preventEmptyValue "./Org0MSP/orderer3.org0.com/tls-msp/signcerts/cert.pem" $CONTENT

kubectl -n n1 create secret generic orderer3.org0.com-tlssigncert --from-literal=cert.pem="$CONTENT"
printMessage "create secret orderer3.org0.com-tlssigncert" $?

export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- cat ./Org0MSP/orderer4.org0.com/tls-msp/signcerts/cert.pem)
preventEmptyValue "./Org0MSP/orderer4.org0.com/tls-msp/signcerts/cert.pem" $CONTENT

kubectl -n n1 create secret generic orderer4.org0.com-tlssigncert --from-literal=cert.pem="$CONTENT"
printMessage "create secret orderer4.org0.com-tlssigncert" $?

######## 8. create secret for org0-tls-ca-cert
export CONTENT=$(kubectl -n n0 exec $POD_RCA0 -- sh -c "cat ./Org0MSP/msp/tlscacerts/tls-ca-cert.pem")
preventEmptyValue "./Org0MSP/msp/tlscacerts/tls-ca-cert.pem" $CONTENT

kubectl -n n1 create secret generic org0-tls-ca-cert --from-literal=tlscacert.pem="$CONTENT"
printMessage "create secret org0-tls-ca-cert" $?

######## 9. Create secret for tls for tlsca, used by ingress controller
export POD_TLSCA0=$(kubectl get pods -n n0 -l "app=hlf-ca,release=tlsca0" -o jsonpath="{.items[0].metadata.name}")
preventEmptyValue "pod unavailable" $POD_TLSCA0

export CERT=$(kubectl -n n0 exec ${POD_TLSCA0} -- cat ./Org0MSP/tls/server/ca-cert.pem)
preventEmptyValue "./Org0MSP/tls/server/ca-cert.pem" $CERT

export KEY=$(kubectl -n n0 exec ${POD_TLSCA0} -- cat ./Org0MSP/tls/server/msp/keystore/key.pem)
preventEmptyValue "./Org0MSP/tls/server/msp/keystore/key.pem" $KEY

kubectl -n n0 create secret generic tlsca0-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
printMessage "create secret tlsca0-tls" $?

######## 10. Create secret for tls for rca, used by ingress controller
export CERT=$(kubectl -n n0 exec ${POD_RCA0} -- cat ./Org0MSP/ca/server/ca-cert.pem)
preventEmptyValue "./Org0MSP/ca/server/ca-cert.pem" $CERT

export KEY=$(kubectl -n n0 exec ${POD_RCA0} -- cat ./Org0MSP/ca/server/msp/keystore/key.pem)
preventEmptyValue "./Org0MSP/ca/server/msp/keystore/key.pem" $KEY

kubectl -n n0 create secret generic rca0-tls --from-literal=tls.crt="$CERT" --from-literal=tls.key="$KEY"
printMessage "create secret rca0-tls" $?
