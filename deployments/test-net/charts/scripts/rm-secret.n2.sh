#!/bin/bash
kubectl -n n2 delete secret peer0.org2.net-admincert
kubectl -n n2 delete secret peer0.org2.net-adminkey
kubectl -n n2 delete secret peer0.org2.net-cacert
kubectl -n n2 delete secret peer0.org2.net-cert
kubectl -n n2 delete secret peer0.org2.net-key
kubectl -n n2 delete secret peer0.org2.net-tls
kubectl -n n2 delete secret peer0.org2.net-tlsrootcert
kubectl -n n2 delete secret tlsca2-tls
kubectl -n n2 delete secret rcaorg2-tls
kubectl -n n2 delete secret orderer0.org0.com-tlsrootcert
kubectl -n n2 delete secret orderer0.org0.com-tlssigncert
# Repeat for n0
kubectl -n n0 delete secret org2-cacerts
kubectl -n n0 delete secret org2-admincerts
kubectl -n n0 delete secret org2-tlscacerts
