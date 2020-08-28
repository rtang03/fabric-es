### Pre-requisite
```shell script
# first time installation of Helm dependency
helm repo add bitnami https://charts.bitnami.com/bitnami
cd orgadmin
helm dep update
```

### LOCAL DEV
```shell script
# Clean install for local dev
# ./scripts/rm-tmp-data.sh
# mkdir -p /tmp/data/org0
# mkdir -p /tmp/data/org1
# mkdir -p /tmp/data/orderers/orderer0
# mkdir -p /tmp/data/orderers/orderer1
# mkdir -p /tmp/data/orderers/orderer2
# mkdir -p /tmp/data/orderers/orderer3
# mkdir -p /tmp/data/orderers/orderer4
# mkdir -p /tmp/data/p0o1-couchdb


kubectl create namespace n0
kubectl create namespace n1

### Local
./scripts/rm-secret.n0.sh
./scripts/rm-secret.n1.sh

# Org 1
helm install admin1 -n n1 -f ./orgadmin/values-admin1.local.yaml ./orgadmin
sleep 2

helm install tlsca1 -n n1 -f ./hlf-ca/values-tlsca1.yaml ./hlf-ca
sleep 2
helm install rca1 -n n1 -f ./hlf-ca/values-rca1.yaml ./hlf-ca

kubectl wait --for=condition=Available --timeout 600s deployment/admin1-orgadmin-cli -n n1
helm install crypto-tlsca1 -n n1 -f ./cryptogen/values-tlsca1.yaml ./cryptogen
kubectl wait --for=condition=complete --timeout 60s job/crypto-tlsca1-cryptogen -n n1
helm install crypto-rca1 -n n1 -f ./cryptogen/values-rca1.yaml ./cryptogen
kubectl wait --for=condition=complete --timeout 120s job/crypto-rca1-cryptogen -n n1

# Org0
helm install admin0 -n n0 -f ./orgadmin/values-admin0.local.yaml ./orgadmin
sleep 2
helm install tlsca0 -n n0 -f ./hlf-ca/values-tlsca0.yaml ./hlf-ca
sleep 2
helm install rca0 -n n0 -f ./hlf-ca/values-rca0.yaml ./hlf-ca

# the fabric binary download may take a few minutes
kubectl wait --for=condition=Available --timeout 600s deployment/admin0-orgadmin-cli -n n0
helm install crypto-tlsca0 -n n0 -f ./cryptogen/values-tlsca0.yaml --dry-run --debug ./cryptogen
kubectl wait --for=condition=complete --timeout 60s job/crypto-tlsca0-cryptogen -n n0
helm install crypto-rca0 -n n0 -f ./cryptogen/values-rca0.yaml --dry-run --debug  ./cryptogen
kubectl wait --for=condition=complete --timeout 120s job/crypto-rca0-cryptogen -n n0

# create secret
./scripts/create-secret.rca0.sh
./scripts/create-secret.rca1.sh
./scripts/create-genesis.sh

helm install o0 -f ./hlf-ord/values-O0.yaml -n n0 ./hlf-ord
sleep 3
helm install o1 -f ./hlf-ord/values-O1.yaml -n n0 ./hlf-ord
sleep 3
helm install o2 -f ./hlf-ord/values-O2.yaml -n n0 ./hlf-ord
sleep 3
helm install o3 -f ./hlf-ord/values-O3.yaml -n n0 ./hlf-ord
sleep 3
helm install o4 -f ./hlf-ord/values-O4.yaml -n n0 ./hlf-ord
sleep 3
helm install p0o1db -n n1 ./hlf-couchdb
sleep 3

helm install p0o1 -n n1 ./hlf-peer

```

### Build chaincode
Note: this step may be change to retrieve from github, for better portability  
```shell script
# build chaincode
pushd .
cd ../../../packages/chaincode
yarn build
printMessage "Build chaincode" $?
popd
rm -r ./chaincode
printMessage "remove chaincode directory" $?
sleep 1
mkdir -p ./chaincode
printMessage "create chaincode directory" $?
sleep 1
cp ../../../packages/chaincode/package.json ./chaincode
printMessage "copy package.json" $?
sleep 1
cp -R ../../../packages/chaincode/dist ./chaincode
printMessage "copy dist" $?
sleep 1
```

### Chaincode Lifecycle Installation
```shell script
# copy chaincode 
export POD_CLI1=$(kubectl get pods --namespace n1 -l "app=orgadmin,release=admin1" -o jsonpath="{.items[0].metadata.name}")
kubectl -n n1 cp ./chaincode $POD_CLI1:./channel-artifacts

###### E2E INSTALL
# helm install bootstrap -n n1 -f ./hlf-operator/values-runn-all.yaml ./hlf-operator

###### MANUAL INSTALL
# create channel only
helm install bootstrap -n n1 -f ./hlf-operator/values-createchannel.yaml ./hlf-operator
# join channel only
helm install bootstrap -n n1 -f ./hlf-operator/values-join.yaml ./hlf-operator
# get channel info
helm install bootstrap -n n1 -f ./hlf-operator/values-getchannelinfo.yaml ./hlf-operator
# update anchor peer only
helm install bootstrap -n n1 -f ./hlf-operator/values-updateanchor.yaml ./hlf-operator
# package chaincode
helm install bootstrap -n n1 -f ./hlf-operator/values-package.yaml ./hlf-operator
# install chaincode
helm install bootstrap -n n1 -f ./hlf-operator/values-install.yaml ./hlf-operator
# queryinstalled
helm install bootstrap -n n1 -f ./hlf-operator/values-queryinstalled.yaml ./hlf-operator
# approve chaincode
helm install bootstrap -n n1 -f ./hlf-operator/values-approve.yaml ./hlf-operator
# queryapproved
helm install bootstrap -n n1 -f ./hlf-operator/values-queryapproved.yaml ./hlf-operator
# checkcommitreadiness
helm install bootstrap -n n1 -f ./hlf-operator/values-checkcommitreadiness.yaml ./hlf-operator
# commit chaincode
helm install bootstrap -n n1 -f ./hlf-operator/values-commit.yaml ./hlf-operator
# querycommitted
helm install bootstrap -n n1 -f ./hlf-operator/values-querycommitted.yaml ./hlf-operator
# init chaincode
helm install bootstrap -n n1 -f ./hlf-operator/values-init.yaml ./hlf-operator
# dev-mode invoke
helm install bootstrap -n n1 -f ./hlf-operator/values-dev-invoke.yaml ./hlf-operator
# dev-mode query
helm install bootstrap -n n1 -f ./hlf-operator/values-dev-query.yaml ./hlf-operator
```

### GCP
```shell script
### GCP
# Org0
helm install admin0 -n n0 -f ./orgadmin/values-admin0.gcp.yaml ./orgadmin
helm install tlsca0 -n n0 -f ./hlf-ca/values-tlsca0.yaml ./hlf-ca
helm install rca0 -n n0 -f ./hlf-ca/values-rca0.yaml ./hlf-ca

# the fabric binary download may take a few minutes
kubectl wait --for=condition=Available --timeout 600s deployment/admin0-orgadmin-cli -n n0
helm install crypto-tlsca0 -n n0 -f ./cryptogen/values-tlsca0.yaml ./cryptogen
kubectl wait --for=condition=complete --timeout 60s job/crypto-tlsca0-cryptogen -n n0
helm install crypto-rca0 -n n0 -f ./cryptogen/values-rca0.yaml ./cryptogen
kubectl wait --for=condition=complete --timeout 120s job/crypto-rca0-cryptogen -n n0

# Org 1
helm install admin1 -n n1 -f ./orgadmin/values-admin1.gcp.yaml ./orgadmin
helm install tlsca1 -n n1 -f ./hlf-ca/values-tlsca1.yaml ./hlf-ca
helm install rca1 -n n1 -f ./hlf-ca/values-rca1.yaml ./hlf-ca

kubectl wait --for=condition=Available --timeout 600s deployment/admin1-orgadmin-cli -n n1
helm install crypto-tlsca1 -n n1 -f ./cryptogen/values-tlsca1.yaml ./cryptogen
kubectl wait --for=condition=complete --timeout 60s job/crypto-tlsca1-cryptogen -n n1
helm install crypto-rca1 -n n1 -f ./cryptogen/values-rca1.yaml ./cryptogen
kubectl wait --for=condition=complete --timeout 120s job/crypto-rca1-cryptogen -n n1

# create secret
./scripts/create-secret.rca0.sh
./scripts/create-secret.rca1.sh
./scripts/create-genesis.sh
```

### Useful commands 
at terminal gcloud
```shell script
# First time setup for gcloud
gcloud container clusters get-credentials dev-org0-core --zone us-central1-c --project fdi-cd
gcloud config set project fdi-cd

# connect gcp n0 pg, for local dev
kubectl -n n0 port-forward pod/admin0-postgresql-0-0 5432

# retrieve password
export CA_ADMIN=$(kubectl get secret -n n0 tlsca0-hlf-ca--ca -o jsonpath="{.data.CA_ADMIN}" | base64 --decode; echo)
export CA_PASSWORD=$(kubectl get secret -n n0 tlsca0-hlf-ca--ca -o jsonpath="{.data.CA_PASSWORD}" | base64 --decode; echo)
```

### Other useful commands
```shell script
# Inside peer or orderer, change logging level 
apk add curl
curl -d '{"spec":"grpc=debug:debug"}' -H "Content-Type: application/json" -X PUT http://127.0.0.1:9443/logspec

# search public helm repository
helm search repo stable

# when there is external helm dependency in Chart.yaml
helm dep update

# debug helm chart
helm install rca0 -f ./hlf-ca/values-rca0.yaml -n n0 ./hlf-ca

# if you want to install a standsalone postgres to defautl namespace, for testing purpose
helm install psql --set postgresqlPassword=hello bitnami/postgresql

# after postgresql is installed, you can valiate it; by decoding the secret
export POSTGRES_PASSWORD=$(kubectl get secret --namespace default psql-postgresql -o jsonpath="{.data.postgresql-password}" | base64 --decode)

# you can launch a port-forward, so that the psql client in host system can access it
kubectl port-forward --namespace default svc/psql-postgresql 5433:5432
```

### External Reference
[hlf-ca helm chart](https://github.com/helm/charts/tree/master/stable/hlf-ca)
[postgres helm chart](https://github.com/bitnami/charts/tree/master/bitnami/postgresql)
[example: nginx ingress](https://matthewpalmer.net/kubernetes-app-developer/articles/kubernetes-ingress-guide-nginx-example.html)
[fabric helm chart](https://medium.com/google-cloud/helm-chart-for-fabric-for-kubernetes-80408b9a3fb6)
[kubect documentation](https://kubectl.docs.kubernetes.io/)
[external chaincode](https://medium.com/swlh/how-to-implement-hyperledger-fabric-external-chaincodes-within-a-kubernetes-cluster-fd01d7544523)
[nginx ingress controller](https://docs.nginx.com/nginx-ingress-controller)
[k8s dashboard](https://github.com/kubernetes/dashboard#kubernetes-dashboard)
[k8s dashboard: how to access](https://docs.bitnami.com/kubernetes/get-started-gke/#step-6-access-the-kubernetes-dashboard)
[k8s api spec](https://pkg.go.dev/k8s.io/api@v0.18.8)
[gke nginx example](https://github.com/GoogleCloudPlatform/community/blob/master/tutorials/nginx-ingress-gke/index.md)

export NGX=$(kubectl get secret --namespace ingress-nginx ingress-nginx-admission -o jsonpath="{.data.cert}" | base64 --decode)

kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v0.34.1/deploy/static/provider/cloud/deploy.yaml

