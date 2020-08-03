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
# terminal 1, namely "admin0"
# terminal 2, namely "tlsca0"
# terminal 3, namely "rca0"
# terminal 4, namely "admin1"
# terminal 5, namely "tlsca1"
# terminal 6, namely "rca1"
# terminal 7, namely "p0o1"

# create namespaces for org0 & org1
# kubectl create namespace n0 
# kubectl create namespace n1

# optionally, remove pre-existing secret
# or take a look at hlf-ca/post-install/rca0/cleanup-secret.sh
# kubectl -n n0 delete secret xxxx
# kubectl -n n1 delete secret xxxx
```

### Step 1 - terminal admin0
```shell script
# Go directory orgadmin
helm install admin0 -f values.0.yaml -n n0 .
```

### Step 2 - terminal tlsca0
```shell script
# remove all-existing secrets for n0
./post-instal/rm-secret.n0.sh

# Go directory hlf-ca
helm install tlsca0 -f values-tlsca0.yaml -n n0 .

# post-install setup
./post-install/setup.tlsca0.sh
```

### Step 3 - terminal rca0
```shell script
# Go directory hlf-ca
helm install rca0 -f values-rca0.yaml -n n0 .

# post-install setup
./post-install/setup.rca0.sh

# create secret
./post-install/create-secret.rca0.sh
```

### Step 4 - terminal admin1
```shell script
# Go directory orgadmin
helm install admin1 -f values.1.yaml -n n1 .
```

### Step 5 - terminal tlsca1
```shell script
# remove all-existing secrets for n0
./post-instal/rm-secret.n1.sh

# Go directory hlf-ca
helm install tlsca1 -f values-tlsca1.yaml -n n1 .

# post-install setup
./post-install/setup.tlsca1.sh
```

### Step 6 - terminal rca1
```shell script
# Go directory hlf-ca
helm install rca1 -f values-rca1.yaml -n n1 .

# post-install setup
./post-install/setup.rca1.sh

# create secret
./post-install/create-secret.rca1.sh
```

### Step 7 - go back terminal admin0
```shell script
# follow the notes instruction of admin0
# create genesis.block and channel.tx
# create secret genesis
# Or Alternatively, go to orgadmin/post-install, and run
./post-install/create-genesis.sh

########Upgrade the chart, so that the secret "org1.net-ca-cert.pem" is updated
helm upgrade admin0 -f values.0.yaml . -n n0
```

### Step 8 - terminal ord
```shell script
helm install o0 -f values.0.yaml -n n0 .
helm install o1 -f values.1.yaml -n n0 .
helm install o2 -f values.2.yaml -n n0 .
helm install o3 -f values.3.yaml -n n0 .
helm install o4 -f values.4.yaml -n n0 .
```

### Step 8 - terminal p0o1
```shell script
# install couchdb for peer0-org1
helm install p0o1db -n n1 .
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
