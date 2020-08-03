#!/bin/bash

kubectl -n n1 delete secret org1-cacerts
kubectl -n n1 delete secret peer0.org1.net-admincert
kubectl -n n1 delete secret peer0.org1.net-cacert
kubectl -n n1 delete secret peer0.org1.net-cert
kubectl -n n1 delete secret peer0.org1.net-key
kubectl -n n1 delete secret peer0.org1.net-tls
kubectl -n n1 delete secret peer0.org1.net-tlsrootcert
kubectl -n n1 delete secret tlsca1-tls
kubectl -n n1 delete secret rcaorg1-tls
