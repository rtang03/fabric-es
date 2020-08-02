## Introduction

### Prerequsite
```shell script
# install nginx ingress controller
# see https://kubernetes.github.io/ingress-nginx/deploy/#docker-for-mac
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v0.34.1/deploy/static/provider/cloud/deploy.yaml
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
# Go directory hlf-ca
helm install tlsca0 -f values-tlsca0.yaml -n n0 .

# Go direcotry hlf-ca/post-install/tlsca0
./bootstrap.sh
```

### Step 3 - terminal rca0
```shell script
# Go directory hlf-ca
helm install rca0 -f values-rca0.yaml -n n0 .

# Go direcotry hlf-ca/post-install/rca0
./bootstrap.sh

# create secret
./secret.sh
```

### Step 4 - terminal admin1
```shell script
# Go directory orgadmin
helm install admin1 -f values.1.yaml -n n1 .
```

### Step 5 - terminal tlsca1
```shell script
# Go directory hlf-ca
helm install tlsca1 -f values-tlsca1.yaml -n n1 .

# Go direcotry hlf-ca/post-install/tlsca1
./bootstrap.sh
```

### Step 6 - terminal rca1
```shell script
# Go directory hlf-ca
helm install rca1 -f values-rca1.yaml -n n1 .

# Go direcotry hlf-ca/post-install/rca1
./bootstrap.sh

# create secret
./secret.sh
```

### Step 7 - terminal admin0
```shell script
# follow the notes instruction of admin0
# create genesis.block and channel.tx
# create secret genesis

```

### Step 8 - terminal ord
```shell script
helm install o0 -f values.0.yaml -n n0 .
```

### Useful commands
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
