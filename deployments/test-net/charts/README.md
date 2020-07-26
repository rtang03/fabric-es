```shell script
gcloud container clusters get-credentials --zone us-central1-a  test-net-cluster-1
```

https://github.com/hyperledger/fabric-ca/blob/master/docs/source/users-guide.rst#enabling-tls
https://github.com/helm/charts/tree/master/stable/hlf-ca
https://github.com/bitnami/charts/tree/master/bitnami/postgresql#parameters

helm search repo stable
helm dep update

helm install psql --set postgresqlPassword=hello bitnami/postgresql

export POSTGRES_PASSWORD=$(kubectl get secret --namespace default psql-postgresql -o jsonpath="{.data.postgresql-password}" | base64 --decode)

echo $POSTGRES_PASSWORD 
hello

kubectl port-forward --namespace default svc/psql-postgresql 5433:5432 &
Forwarding from 127.0.0.1:5433 -> 5432
Forwarding from [::1]:5433 -> 5432

PGPASSWORD="$POSTGRES_PASSWORD" psql --host 127.0.0.1 -U postgres -d postgres -p 5433
Handling connection for 5433
psql: error: could not connect to server: FATAL:  password authentication failed for user "postgres"


kubectl get storageclasses.storage.k8s.io

export CA_PASSWORD=$(kubectl get secret --namespace {{ .Release.Namespace }} org1-ca -o jsonpath="{.data.CA_PASSWORD}" | base64 --decode; echo)

kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v0.34.1/deploy/static/provider/cloud/deploy.yaml

https://kubernetes.github.io/ingress-nginx/deploy/#docker-for-mac

helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx

https://matthewpalmer.net/kubernetes-app-developer/articles/kubernetes-ingress-guide-nginx-example.html

helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
