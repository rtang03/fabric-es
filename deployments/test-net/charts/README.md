## Introduction

### Prerequsite
```shell script
# install nginx ingress controller
# see https://kubernetes.github.io/ingress-nginx/deploy/#docker-for-mac
# kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v0.34.1/deploy/static/provider/cloud/deploy.yaml
```

### Steps 0 - Preparing Terminals
You should need multiple terminals
```shell script
# terminal 1, namely "org0"
# terminal 2, namely "org1"

# create namespaces for org0 & org1
# kubectl create namespace n0 
# kubectl create namespace n1

# optionally, remove pre-existing secret
# or take a look at hlf-ca/post-install/rca0/cleanup-secret.sh
# kubectl -n n0 delete secret xxxx
# kubectl -n n1 delete secret xxxx
```

### Step 1 - terminal org0 - install admin0
```shell script
helm install admin0 -f ./orgadmin/values.0.yaml -n n0 ./orgadmin
```

### Step 2 - terminal org0 - install tlsca0
```shell script
# remove all-existing secrets for n0
./orgadmin/post-instal/rm-secret.n0.sh

helm install tlsca0 -f ./hlf-ca/values-tlsca0.yaml -n n0 ./hlf-ca

# post-install setup
./hlf-ca/post-install/setup.tlsca0.sh
```

### Step 3 - terminal org0 - install rca0
```shell script
helm install rca0 -f ./hlf-ca/values-rca0.yaml -n n0 ./hlf-ca

# post-install setup
./hlf-ca/post-install/setup.rca0.sh

# create secret
./hlf-ca/post-install/create-secret.rca0.sh
```

### Step 4 - terminal org1 - install admin1
```shell script
helm install admin1 -f ./orgadmin/values.1.yaml -n n1 ./orgadmin
```

### Step 5 - terminal org1 - install tlsca1
```shell script
# remove all-existing secrets for n1
# but don't remove orderer's tls root cert, created by step 3. 
./hlf-ca/post-install/rm-secret.n1.sh

helm install tlsca1 -f ./hlf-ca/values-tlsca1.yaml -n n1 ./hlf-ca

# post-install setup
./hlf-ca/post-install/setup.tlsca1.sh
```

### Step 6 - terminal org1 - install rca1
```shell script
# Go directory hlf-ca
helm install rca1 -f ./hlf-ca/values-rca1.yaml -n n1 ./hlf-ca

# post-install setup
./hlf-ca/post-install/setup.rca1.sh

# create secret
./hlf-ca/post-install/create-secret.rca1.sh
```

### Step 7 - go back terminal org0
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
```

### Step 9 - terminal org1 - install peer0-org1
```shell script
helm install p0o1 -n n1 ./hlf-peer
```

### Step 10 - terminal org1 - create channel
```shell script
docker exec \
  -e CORE_PEER_ADDRESS=${FIRST_PEER}-${FIRST_CODE}:${FIRST_PORT} \
  -e CORE_PEER_LOCALMSPID=${FIRST_NAME}MSP \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
  -e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${FIRST_NAME}MSP/admin/msp \
  cli peer channel create -c loanapp -f /var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/assets/channel.tx -o ${ORDERER_PEER}-${ORDERER_CODE}:${ORDERER_PORT} \
    --outputBlock /var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/assets/loanapp.block \
    --tls --cafile /var/artifacts/crypto-config/${FIRST_NAME}MSP/${FIRST_PEER}.${FIRST_DOMAIN}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

export POD_CLI1=$(kubectl get pods -n n1 -l "app=orgadmin,release=admin1" -o jsonpath="{.items[0].metadata.name}")

kubectl -n n1 exec $POD_CLI1 -- /bin/bash

export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_ADDRESS="p0o1-hlf-peer:7051"
export CORE_PEER_MSPCONFIGPATH=/var/hyperledger/crypto-config/Org1MSP/peer0.org1.net/admin_msp
peer channel create -c loanapp -f /var/hyperledger/crypto-config/Org1MSP/hl_config/channel/channeltx \
 -o o0-hlf-ord:7050 \
 --outputBlock /var/hyperledger/crypto-config/Org1MSP/peer0.org1.net/loanapp.block --tls \
 --cafile /var/hyperledger/crypto-config/Org1MSP/peer0.org1.net/tls-msp/ord/cert/tlscacert.pem
```

### Other useful commands
```shell script
# search public helm repository
helm search repo stable

# when there is external helm dependency in Chart.yaml
helm dep update

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
