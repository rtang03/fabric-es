#!/bin/bash

helm install admin1 -f ./orgadmin/values.1.yaml -n n1 ./orgadmin

sleep 1

helm install tlsca1 -f ./hlf-ca/values-tlsca1.yaml -n n1 ./hlf-ca

sleep 1

helm install rca1 -f ./hlf-ca/values-rca1.yaml -n n1 ./hlf-ca

sleep 1

helm install p0o1db -n n1 ./hlf-couchdb

sleep 1

helm install p0o1 -n n1 ./hlf-peer
