## Introduction
This chart installs the Org0's (a) TLS CA server (a.k.a. tls-ca-org0), and (b) root CA server (a.k.a. rca-org0)  

p.s. The current chart installs from local-machine, instead of coming from helm repository.   

### Prerequisites
- Kubernetes 1.16+ 
- Helm 3
- nginx ingress controller

### Default installation
Before installation, you can use the default values from `./values.yaml`. Or may use custom value, `./values-production.yaml`

```shell script
# install when you are using '.values.yaml'
helm install fdi .

# install when with custom parameters
helm install fdi -f ./value-production.yaml .
```

### Set custom parameters
```shell script
# Set custom parameters with postgres password
helm install fdi --set postgresql-0.postgresqlPassword=password . 

# Set custom parameters with postgres password and tls password
helm install fdi --set tls-ca-org0.adminPassword=password .
 
# Set custom parameters with postgres password and rca password
helm install fdi --set rca-org0.adminPassword=password . 

# Set custom parameters with multi password
helm install fdi --set tls-ca-org0.adminPassword=password,rca-org0.adminPassword=password . 
```

### Post installation tasks
```shell script
### For tls-ca-org0
# get pod id for pod tls-ca-org0
export POD_TLS_CA=$(kubectl get pods --namespace default -l "app=tls-ca-org0,release=fdi" -o jsonpath="{.items[0].metadata.name}")

# get CA password for k8s secret
export CA_PASSWORD=$(kubectl get secret --namespace default fdi-tls-ca-org0--ca -o jsonpath="{.data.CA_PASSWORD}" | base64 --decode; echo)

### For rca-org0
# get pod id for rca-org0
export POD_RCA_ORG0=$(kubectl get pods --namespace default -l "app=rca-org0,release=fdi" -o jsonpath="{.items[0].metadata.name}")

# get CA password for k8s secret
export CA_PASSWORD=$(kubectl get secret --namespace default fdi-rca-org0--ca -o jsonpath="{.data.CA_PASSWORD}" | base64 --decode; echo)
```

### Create genesis block and channelTx
```shell script

```

### Other task
```shell script
# uninstall
helm uninstall fdi
```
