## Introduction
This chart installs the common utilties for org administrator
1. "fabric-tools" cli pod
2. postgres db

### Prerequisites
- Kubernetes 1.16+ 
- Helm 3
- nginx ingress controller

### Naming Convention
Namespace:  
- org0: `n0` 
- org1: `n1` 

Release name
- org0: `admin0`
- org1: `admin1`

### Default installation
Before installation, you can input the correct values from `./values.X.yaml`.

```shell script
# Create namespaces: n0 is org0 ; n1 is org1
kubectl create namespace n0
kubectl create namespace n1

# install Org Admin for org0
helm install admin0 -f ./values.0.yaml -n n0 .

helm install admin1 -f ./values.1.yaml -n n1 .
```

### Set custom parameters
```shell script
# Set custom parameters with postgres password
helm install admin0 --set postgresql-0.postgresqlPassword=password -n n0 .  
```

### Post installation tasks
After installation, you can validate it
```shell script
helm ls -n n0

kubectl get pod -n n0
```
