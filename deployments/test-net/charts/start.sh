#!/bin/bash

# start.sh resume previous installation

helm install admin1 -f ./orgadmin/values.1.yaml -n n1 ./orgadmin
helm install tlsca1 -f ./hlf-ca/values-tlsca1.yaml -n n1 ./hlf-ca

sleep 15

helm install rca1 -f ./hlf-ca/values-rca1.yaml -n n1 ./hlf-ca

sleep 15

helm install admin0 -f ./orgadmin/values.0.yaml -n n0 ./orgadmin
helm install tlsca0 -f ./hlf-ca/values-tlsca0.yaml -n n0 ./hlf-ca

sleep 15

helm install rca0 -f ./hlf-ca/values-rca0.yaml -n n0 ./hlf-ca

sleep 15

helm install o0 -f ./hlf-ord/values.0.yaml -n n0 ./hlf-ord

sleep 3

helm install o1 -f ./hlf-ord/values.1.yaml -n n0 ./hlf-ord

sleep 3

helm install o2 -f ./hlf-ord/values.2.yaml -n n0 ./hlf-ord

sleep 3

helm install o3 -f ./hlf-ord/values.3.yaml -n n0 ./hlf-ord

sleep 3

helm install o4 -f ./hlf-ord/values.4.yaml -n n0 ./hlf-ord

sleep 15

helm install p0o1db -n n1 ./hlf-couchdb

sleep 15

helm install p0o1 -n n1 ./hlf-peer
