### Step 1
```shell script
kubectl create n0
kubectl create n1

helm install admin0 -f ./orgadmin/values.0.yaml -n n0 ./orgadmin
helm install tlsca0 -n n0 ./hlf-ca
helm install rca0 -f ./hlf-ca/values-rca0.yaml -n n0 ./hlf-ca
```
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
