### Step 1
```shell script
kubectl create n0
kubectl create n1

# Local
helm install admin0 -n n0 -f ./orgadmin/values-admin0.local.yaml ./orgadmin
helm install tlsca0 -n n0 -f ./hlf-ca/values-tlsca0.local.yaml ./hlf-ca
helm install rca0 -n n0 -f ./hlf-ca/values-rca0.local.yaml ./hlf-ca

# the fabric binary download may take a few minutes
kubectl wait --for=condition=Available --timeout 600s deployment/admin0-orgadmin-cli -n n0
helm install create-crypto0 ./create-crypto -n n0

# GCP
helm install admin0 -n n0 -f ./orgadmin/values-admin0.gcp.yaml ./orgadmin
helm install tlsca0 -n n0 -f ./hlf-ca/values-tlsca0.gcp.yaml ./hlf-ca
helm install rca0 -n n0 -f ./hlf-ca/values-rca0.gcp.yaml ./hlf-ca

./scripts/rm-secret.n0.sh
./scripts/setup.tlsca0.sh
./scripts/setup.rca0.sh
```

helm install admin0 -f ./orgadmin/values.0.yaml -n n0 ./orgadmin
helm install tlsca0 -n n0 ./hlf-ca
helm install rca0 -f ./hlf-ca/values-rca0.yaml -n n0 ./hlf-ca

### Commands
gcloud container clusters get-credentials dev-org0-core --zone us-central1-c --project fdi-cd
gcloud config set project fdi-cd

Manual disk creation  
(not working, need to specific region, along with replicates)
 gcloud compute disks create --type=pd-standard --size=10GB manual-disk-org0


### connect gcp n0 pg, for local dev
at terminal gcloud
```shell script
kubectl -n n0 port-forward pod/admin0-postgresql-0-0 5432
```

kubectl wait --for=condition=Initialized pod/csi-linode-controller-0
kubectl wait --for=condition=Initialized pod/csi-linode-controller-0
kubectl wait --for=condition=Available deployment/admin0-orgadmin-cli -n n0
tlsca0-hlf-ca.n0.svc.cluster.local

export CA_ADMIN=$(kubectl get secret -n n0 tlsca0-hlf-ca--ca -o jsonpath="{.data.CA_ADMIN}" | base64 --decode; echo)
export CA_PASSWORD=$(kubectl get secret -n n0 tlsca0-hlf-ca--ca -o jsonpath="{.data.CA_PASSWORD}" | base64 --decode; echo)

How to wait po to be ready
while [[ $(kubectl get pods -l app=hello -o 'jsonpath={..status.conditions[?(@.type=="Ready")].status}') != "True" ]]; do echo "waiting for pod" && sleep 1; done
