### LOCAL DEV
```shell script
kubectl create n0
kubectl create n1

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

# create channel only
helm install bootstrap -n n1 -f ./hlf-operator/values-createchannel.yaml ./hlf-operator

# join channel only
helm install bootstrap -n n1 -f ./hlf-operator/values-join.yaml ./hlf-operator

# get channel info
helm install bootstrap -n n1 -f ./hlf-operator/values-getchannelinfo.yaml ./hlf-operator

# update anchor peer only
helm install bootstrap -n n1 -f ./hlf-operator/values-updateanchor.yaml ./hlf-operator
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

### Upload chaincode
```shell script
export POD_CLI1=$(kubectl get pods --namespace n1 -l "app=orgadmin,release=admin1" -o jsonpath="{.items[0].metadata.name}")
# preventEmptyValue "pod unavailable" $POD_CLI1

kubectl -n n1 cp ./chaincode $POD_CLI1:./channel-artifacts

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
