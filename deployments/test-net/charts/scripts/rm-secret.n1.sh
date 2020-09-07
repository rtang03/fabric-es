#!/bin/bash
## Mandatory
kubectl -n n1 delete secret peer0.org1.net-admincert
kubectl -n n1 delete secret peer0.org1.net-adminkey
kubectl -n n1 delete secret peer0.org1.net-cacert
kubectl -n n1 delete secret peer0.org1.net-cert
kubectl -n n1 delete secret peer0.org1.net-key
kubectl -n n1 delete secret peer0.org1.net-tls
kubectl -n n1 delete secret peer0.org1.net-tlsrootcert
kubectl -n n1 delete secret tlsca1-tls
kubectl -n n1 delete secret rcaorg1-tls
kubectl -n n1 delete secret orderer0.org0.com-tlsrootcert
kubectl -n n1 delete secret orderer1.org0.com-tlsrootcert
kubectl -n n1 delete secret orderer2.org0.com-tlsrootcert
kubectl -n n1 delete secret orderer3.org0.com-tlsrootcert
kubectl -n n1 delete secret orderer4.org0.com-tlsrootcert
kubectl -n n1 delete secret orderer0.org0.com-tlssigncert
kubectl -n n1 delete secret orderer1.org0.com-tlssigncert
kubectl -n n1 delete secret orderer2.org0.com-tlssigncert
kubectl -n n1 delete secret orderer3.org0.com-tlssigncert
kubectl -n n1 delete secret orderer4.org0.com-tlssigncert
kubectl -n n1 delete secret channeltx
kubectl -n n1 delete secret org0-tls-ca-cert
# Repeat for n0
# Intentionally, to ensure the secret are truly cleaned up.
kubectl -n n0 delete secret org1-admincerts
kubectl -n n0 delete secret org1-tlscacerts
kubectl -n n0 delete secret org1-cacerts

## Optional
## When additional org join the network, it shall later add more tls certs.
kubectl -n n1 delete secret	peer0.org2.net-tls
