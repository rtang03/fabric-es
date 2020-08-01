#!/bin/bash

kubectl -n n1 create secret peer0.org1.net-admincert
kubectl -n n1 create secret peer0.org1.net-cacert
kubectl -n n1 create secret peer0.org1.net-cert
kubectl -n n1 create secret peer0.org1.net-key
kubectl -n n1 create secret peer0.org1.net-tls
kubectl -n n1 create secret peer0.org1.net-tlsrootce
