#!/bin/bash
# doubt it
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