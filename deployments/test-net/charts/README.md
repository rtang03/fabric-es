## Introduction

### Prerequsite
```shell script
# install nginx ingress controller
# see https://kubernetes.github.io/ingress-nginx/deploy/#docker-for-mac
# kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v0.34.1/deploy/static/provider/cloud/deploy.yaml
```

### Steps 0 - Get Prepared
```shell script
# You should need multiple terminals
# new terminal 1, namely "org0"
# new terminal 2, namely "org1"

# create namespaces for org0 & org1
# kubectl create namespace n0 
# kubectl create namespace n1

# optionaly, create alias
# alias k0="kubectl -n n0"
# alias k1="kubectl -n n1"

# Make sure if all pods are up, before each step
# k0 get pod
# k1 get pod

# remove all-existing secrets for n0
# ./hlf-ca/post-install/rm-secret.n0.sh
# remove all-existing secrets for n1
# ./hlf-ca/post-install/rm-secret.n1.sh

# When using k8s manual storage class
# Ensure below volumes are created, before installation
# crytpo-material - org0 and config
# - /tmp/data/org0

# crytpo-material - org1 and config
# - /tmp/data/org1

# crytpo-material - peer0-org1 and config
# - /tmp/data/p0o1

# couchdb for org1
# - /tmp/data/p0o1-couchdb

# orderer's ledger
# - /tmp/data/orderers/ordere0
# - /tmp/data/orderers/ordere1
# - /tmp/data/orderers/ordere2
# - /tmp/data/orderers/ordere3
# - /tmp/data/orderers/ordere4
```

### Step 1 - terminal org1 - install admin1
```shell script
# Notes: no post-install steps
helm install admin1 -f ./orgadmin/values.1.yaml -n n1 ./orgadmin
```

### Step 2 - terminal org1 - install tlsca1 and rca1
```shell script
helm install tlsca1 -f ./hlf-ca/values-tlsca1.yaml -n n1 ./hlf-ca

# after pods are up; run post-install setup
./hlf-ca/post-install/setup.tlsca1.sh
```

### Step 3 - terminal org1 - install rca1
```shell script
helm install rca1 -f ./hlf-ca/values-rca1.yaml -n n1 ./hlf-ca

# post-install setup
./hlf-ca/post-install/setup.rca1.sh

# create secret**
./hlf-ca/post-install/create-secret.rca1.sh
```

### Step 4 - terminal org0 - install admin0
```shell script
helm install admin0 -f ./orgadmin/values.0.yaml -n n0 ./orgadmin

# DO NOT perform post-install now - create genesis.block
```

### Step 5 - terminal org0 - install tlsca0
```shell script
helm install tlsca0 -f ./hlf-ca/values-tlsca0.yaml -n n0 ./hlf-ca

# post-install setup
./hlf-ca/post-install/setup.tlsca0.sh
```

### Step 6 - terminal org0 - install rca0
```shell script
helm install rca0 -f ./hlf-ca/values-rca0.yaml -n n0 ./hlf-ca

# post-install setup
./hlf-ca/post-install/setup.rca0.sh

# create secret
./hlf-ca/post-install/create-secret.rca0.sh
```

### Step 7 - terminal org0
```shell script
# follow the notes instruction of admin0
# create genesis.block and channel.tx
# Or Alternatively, go to orgadmin/post-install, and run
./orgadmin/post-install/create-genesis.sh

########Upgrade the chart, so that the secret "org1.net-ca-cert.pem" is updated
helm upgrade admin0 -f ./orgadmin/values.0.yaml -n n0 ./orgadmin
helm upgrade admin1 -f ./orgadmin/values.1.yaml -n n1 ./orgadmin
```

### Step 8 - terminal org0 - install orderers
```shell script
helm install o0 -f ./hlf-ord/values.0.yaml -n n0 ./hlf-ord
helm install o1 -f ./hlf-ord/values.1.yaml -n n0 ./hlf-ord
helm install o2 -f ./hlf-ord/values.2.yaml -n n0 ./hlf-ord
helm install o3 -f ./hlf-ord/values.3.yaml -n n0 ./hlf-ord
helm install o4 -f ./hlf-ord/values.4.yaml -n n0 ./hlf-ord
```

### Step 8 - terminal org1 - install couchdb
```shell script
# install couchdb for peer0-org1
helm install p0o1db -n n1 ./hlf-couchdb

# post-install: validate if it runs well
# https://docs.couchdb.org/en/master/fauxton/install.html
# export POD_COUCH=$(kubectl get pods --namespace n1 -l "app=hlf-couchdb,release=p0o1db" -o jsonpath="{.items[0].metadata.name}")
# kubectl port-forward $POD_NAME 8080:5984 -n n1
# http://127.0.0.1:8080/_utils
```

### Step 9 - terminal orderer0  

```shell script
# stream logs from orderer0 for monitoring
export POD_ORD=$(kubectl get pods --namespace n0 -l "app=hlf-ord,release=o0" -o jsonpath="{.items[0].metadata.name}")
kubectl -n n0 logs -f $POD_ORD

# validate service
# nslookup o0-hlf-ord.n0.svc.cluster.local
# nslookup p0o1-hlf-peer.n1.svc.cluster.local
kubectl -n n0 get service

# it should return
# NAME                           TYPE        CLUSTER-IP    
# admin0-postgresql-0            NodePort    10.99.181.168 
# admin0-postgresql-0-headless   ClusterIP   None          
# o0-hlf-ord                     ClusterIP   10.103.183.167
# o1-hlf-ord                     ClusterIP   10.102.110.159
# o2-hlf-ord                     ClusterIP   10.109.192.161
# o3-hlf-ord                     ClusterIP   10.111.235.142
# o4-hlf-ord                     ClusterIP   10.110.101.179
# rca0-hlf-ca                    ClusterIP   10.107.243.4  
# tlsca0-hlf-ca                  ClusterIP   10.96.27.25   
```

### Step 10 - terminal org1: install peer0-org1
Before installing `p0o1` chart, we need to add hostAlias of orderers. In `charts/hlf-peer/values.yaml`, 
update "orderers.hostAlias" for corresponding orderer.

Todo: May later figure out how to discover orderer0.org0.com, via coredns.

```shell script
helm install p0o1 -n n1 ./hlf-peer

export POD_PEER=$(kubectl get pods --namespace n1 -l "app=hlf-peer,release=p0o1" -o jsonpath="{.items[0].metadata.name}")
kubectl -n n1 logs -f $POD_PEER
```

### Step 11: terminal cli: Create Channel 
```shell script
# terminal cli1
# check if you can find orderer0, it should return its resolved address

export POD_CLI1=$(kubectl get pods --namespace n1 -l "app=orgadmin,release=admin1" -o jsonpath="{.items[0].metadata.name}")

kubectl -n n1 exec -it $POD_CLI1 -- sh -c "peer channel create -c loanapp -f /var/hyperledger/crypto-config/Org1MSP/channeltx/channel.tx \
 -o o0-hlf-ord.n0.svc.cluster.local:7050 \
 --outputBlock /var/hyperledger/crypto-config/Org1MSP/peer0.org1.net/loanapp.block --tls \
 --cafile /var/hyperledger/crypto-config/Org1MSP/peer0.org1.net/ord/tls-msp/signcerts/cert.pem \
 --ordererTLSHostnameOverride o0-hlf-ord"
```

### Step 12: terminal cli: Join Channel 
```shell script
# terminal cli1
# join channel
kubectl -n n1 exec -it $POD_CLI1 -- sh -c "peer channel join -b /var/hyperledger/crypto-config/Org1MSP/peer0.org1.net/loanapp.block"

# query channel info
kubectl -n n1 exec -it $POD_CLI1 -- sh -c "peer channel getinfo -c loanapp"
```

### Step 13: terminal cli: Update anchor peer
```shell script
kubectl -n n1 exec -it $POD_CLI1 -- sh -c "peer channel update -c loanapp -f /var/hyperledger/crypto-config/Org1MSP/anchortx/Org1MSPAnchor.tx \
  -o o0-hlf-ord.n0.svc.cluster.local:7050 \
  --tls --cafile /var/hyperledger/crypto-config/Org1MSP/peer0.org1.net/ord/tls-msp/signcerts/cert.pem \
  --ordererTLSHostnameOverride o0-hlf-ord"
```


cli peer channel update -c loanapp -f /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/assets/${NAME}Anchors.tx \
      -o ${ORDERER_PEER}-${ORDERER_CODE}:${ORDERER_PORT} \
      --tls --cafile /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
      
### Other useful commands
```shell script
# search public helm repository
helm search repo stable

# when there is external helm dependency in Chart.yaml
helm dep update

# debug helm chart
helm install rca0 -f ./hlf-ca/values-rca0.yaml -n n0 --dry-run --debug ./hlf-ca

# if you want to install a standsalone postgres to defautl namespace, for testing purpose
helm install psql --set postgresqlPassword=hello bitnami/postgresql

# after postgresql is installed, you can valiate it; by decoding the secret
export POSTGRES_PASSWORD=$(kubectl get secret --namespace default psql-postgresql -o jsonpath="{.data.postgresql-password}" | base64 --decode)

# you can launch a port-forward, so that the psql client in host system can access it
kubectl port-forward --namespace default svc/psql-postgresql 5433:5432

# login with psql
PGPASSWORD="$POSTGRES_PASSWORD" psql --host 127.0.0.1 -U postgres -d postgres -p 5433
```

### External Reference
https://github.com/hyperledger/fabric-ca/blob/master/docs/source/users-guide.rst#enabling-tls
https://github.com/helm/charts/tree/master/stable/hlf-ca
https://github.com/bitnami/charts/tree/master/bitnami/postgresql#parameters
https://matthewpalmer.net/kubernetes-app-developer/articles/kubernetes-ingress-guide-nginx-example.html

k0 exec -it admin0-orgadmin-cli-846645c4dc-nlzdf -- cat /etc/resolv.conf
