#!/bin/bash
. ./scripts/setup.sh

# Bootstrap.sh install from nothing.
# requires to manual clean up PV, e.g. /tmp/data before running.

./hlf-ca/post-install/rm-secret.n0.sh
./hlf-ca/post-install/rm-secret.n1.sh

helm install admin1 -f ./orgadmin/values.1.yaml -n n1 ./orgadmin
sleep 2
helm install tlsca1 -f ./hlf-ca/values-tlsca1.yaml -n n1 ./hlf-ca
sleep 2
helm install rca1 -f ./hlf-ca/values-rca1.yaml -n n1 ./hlf-ca
sleep 2
helm install admin0 -f ./orgadmin/values.0.yaml -n n0 ./orgadmin
sleep 2
helm install tlsca0 -f ./hlf-ca/values-tlsca0.yaml -n n0 ./hlf-ca
sleep 2
helm install rca0 -f ./hlf-ca/values-rca0.yaml -n n0 ./hlf-ca

sleep 60
./hlf-ca/post-install/setup.tlsca1.sh
./hlf-ca/post-install/setup.rca1.sh
./hlf-ca/post-install/create-secret.rca1.sh
./hlf-ca/post-install/setup.tlsca0.sh
./hlf-ca/post-install/setup.rca0.sh
./hlf-ca/post-install/create-secret.rca0.sh
./orgadmin/post-install/create-genesis.sh

sleep 1

helm upgrade admin0 -f ./orgadmin/values.0.yaml -n n0 ./orgadmin
sleep 2
helm upgrade admin1 -f ./orgadmin/values.1.yaml -n n1 ./orgadmin

sleep 60

helm install o1 -f ./hlf-ord/values.1.yaml -n n0 ./hlf-ord
sleep 2
helm install o2 -f ./hlf-ord/values.2.yaml -n n0 ./hlf-ord
sleep 2
helm install o3 -f ./hlf-ord/values.3.yaml -n n0 ./hlf-ord
sleep 2
helm install o4 -f ./hlf-ord/values.4.yaml -n n0 ./hlf-ord
sleep 2
helm install o0 -f ./hlf-ord/values.0.yaml -n n0 ./hlf-ord
sleep 5
helm install p0o1db -n n1 ./hlf-couchdb

sleep 60

# update hostAlias in peer0 manually
# helm install p0o1 -n n1 ./hlf-peer
