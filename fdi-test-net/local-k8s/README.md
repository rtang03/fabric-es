### Pre-requisite

- enable kubernetes in Docker Desktop for Mac. Make sure it is _running_

### Prepare crypto-material in network2

```shell script
# check environment
kubectl get nodes

# should output:
# NAME             STATUS   ROLES    AGE    VERSION
# docker-desktop   Ready    master   2d7h   v1.15.5

# prepare crypto-material
# cd ~/network2
./start.sh

# tear down the network, running network is not required. 
# Do not run ./cleanup.sh It removes crypto-material
# cd ~/network2/config
docker-compose down
```

### Deploy services and update hostAliases

```shell script
# cd ~/fdi-test-net/local-k8s
kubectl apply -f orderer0-svc.yaml
kubectl apply -f orderer1-svc.yaml
kubectl apply -f orderer2-svc.yaml
kubectl apply -f orderer3-svc.yaml
kubectl apply -f orderer4-svc.yaml
kubectl apply -f org1peer0-svc.yaml
kubectl apply -f org1peer0-svc.yaml
kubectl apply -f org1peer1-svc.yaml
kubectl apply -f org2peer0-svc.yaml
kubectl apply -f org2peer1-svc.yaml
kubectl apply -f rca0-svc.yaml
kubectl apply -f rca1-svc.yaml
kubectl apply -f rca2-svc.yaml
kubectl apply -f tls-ca-svc.yaml
kubectl apply -f org1-auth-db-svc.yaml

# check running service
kubectl get svc

# should output:
# NAME           TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
# kubernetes     ClusterIP   10.96.0.1        <none>        443/TCP                      2d7h
# orderer0       ClusterIP   10.110.110.119   <none>        7050/TCP                     44h
# orderer1       ClusterIP   10.99.150.69     <none>        7150/TCP                     44h
# orderer2       ClusterIP   10.104.94.102    <none>        7250/TCP                     44h
# orderer3       ClusterIP   10.101.85.41     <none>        7350/TCP                     44h
# orderer4       ClusterIP   10.101.105.49    <none>        7450/TCP                     44h
# org1-auth-db   ClusterIP   10.109.233.238   <none>        5432/TCP                     12s
# org1peer0      ClusterIP   10.111.189.116   <none>        7051/TCP,7053/TCP,7052/TCP   45h
# org1peer1      ClusterIP   10.99.157.159    <none>        7151/TCP,7153/TCP,7152/TCP   32h
# org2peer0      ClusterIP   10.111.251.178   <none>        7251/TCP,7253/TCP,7252/TCP   32h
# org2peer1      ClusterIP   10.97.226.93     <none>        7351/TCP,7353/TCP,7352/TCP   32h
# rca0           ClusterIP   10.104.54.113    <none>        6053/TCP                     20h
# rca1           ClusterIP   10.109.90.181    <none>        6054/TCP                     20h
# rca2           ClusterIP   10.108.87.210    <none>        6055/TCP                     20h
# tls-ca         ClusterIP   10.107.191.68    <none>        6052/TCP                     20h
```

Note that service's ip is stable, even the bounded pod is later removed. And, we shall use service ip instead of 
pod ip; to update the deployment files. For EACH of deployment file, need to make sure the _hostAliases_ are correctly
configured. The _hostAliases_ will produce the correct `/etc/hosts` in each pod. This is essential for inter-pod communication.

```yaml
# see below example in orderer0-deploy.yaml
template:
    metadata:
      labels:
        name: orderer0
    spec:
      hostAliases:
        - ip: "10.107.191.68"
          hostnames:
            - "tls-ca.hktfp.com"
        - ip: "10.104.54.113"
          hostnames:
            - "rca.hktfp.com"
        - ip: "10.109.90.181"
          hostnames:
            - "rca.etradeconnect.net"
        - ip: "10.108.87.210"
```

### Deploy persistent volume

```shell script
# make local production data to be mounted, if not existed
mkdir -p /tmp/data
mkdir -p /tmp/data_org1peer0
mkdir -p /tmp/data_org1peer1
mkdir -p /tmp/data_org2peer0
mkdir -p /tmp/data_org2peer1

# cd ~/fdi-test-net/local-k8s
kubectl apply -f fabric-pv.yaml
kubectl apply -f fabric-pv-claim.yaml
kubectl apply -f org1peer0-pv.yaml
kubectl apply -f org1peer0-pv-claim.yaml
kubectl apply -f org2peer0-pv.yaml
kubectl apply -f org2peer0-pv-claim.yaml
kubectl apply -f org1peer1-pv.yaml
kubectl apply -f org1peer1-pv-claim.yaml
kubectl apply -f org2peer1-pv.yaml
kubectl apply -f org2peer1-pv-claim.yaml

# check persistentVoluem
kubectl get pv

# should output:
# NAME           CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS   CLAIM                        STORAGECLASS   REASON   AGE
# fabric-pv      5Gi        RWX            Retain           Bound    default/task-pv-claim        manual                  2d17h
# org1peer0-pv   1Gi        RWO            Retain           Bound    default/org1peer0-pv-claim   manual                  119s
# org1peer1-pv   1Gi        RWO            Retain           Bound    default/org1peer1-pv-claim   manual                  2m13s
# org2peer0-pv   1Gi        RWO            Retain           Bound    default/org2peer0-pv-claim   manual                  2m14s
# org2peer1-pv   1Gi        RWO            Retain           Bound    default/org2peer1-pv-claim   manual                  2m13s

# deploy helper tool pod
kubectl apply -f fabric-tools.yaml

# make sure fabric-tools pod is running, before continue
kubectl get pods --output=wide

# should output:
# NAME           READY   STATUS    RESTARTS   AGE   IP          NODE             NOMINATED NODE   READINESS GATES
# fabric-tools   1/1     Running   0          35s   10.1.0.98   docker-desktop   <none>           <none>

# copy cryto-material into k8s persistentVolume. You can go to /tmp/data to validate it.
kubectl cp ../../network2/artifacts/crypto-config/ fabric-tools:/var/artifacts/
```

### Launch pods

```shell script
# cd ~/fdi-test-net/local-k8s
# execute below deployment one by one
kubectl apply -f tls-ca-deploy.yaml
kubectl apply -f rca0-deploy.yaml
kubectl apply -f rca1-deploy.yaml
kubectl apply -f rca2-deploy.yaml
kubectl apply -f orderer0-deploy.yaml
kubectl apply -f orderer1-deploy.yaml
kubectl apply -f orderer2-deploy.yaml
kubectl apply -f orderer3-deploy.yaml
kubectl apply -f orderer4-deploy.yaml
kubectl apply -f org1peer0-deploy.yaml
kubectl apply -f org1peer1-deploy.yaml
kubectl apply -f org2peer0-deploy.yaml
kubectl apply -f org2peer1-deploy.yaml
kubectl apply -f org1-auth-db-deploy.yaml
# kubectl apply -f org1-auth-deploy.yaml

# optionally, open a new terminal. show logs for orderers
kubectl logs -f -l app=orderer --all-containers

# optionally, open a new terminal. show logs for peers
kubectl logs -f -l app=peer --all-containers
```

### Validate the deployment status
```shell script
# optionally, check fabric-tools pod ready, before continue
kubectl get pods --output=wide

# should output:
# NAME                         READY   STATUS    RESTARTS   AGE     IP           NODE             NOMINATED NODE   READINESS GATES
# fabric-tools                 1/1     Running   0          15h     10.1.0.113   docker-desktop   <none>           <none>
# orderer0-84bd7cbd5b-tjh9c    1/1     Running   0          23m     10.1.0.127   docker-desktop   <none>           <none>
# orderer1-7f4dcd97bb-pml28    1/1     Running   0          21m     10.1.0.128   docker-desktop   <none>           <none>
# orderer2-6fcdfb9776-kh9mx    1/1     Running   0          21m     10.1.0.129   docker-desktop   <none>           <none>
# orderer3-56869f899f-rvdq7    1/1     Running   0          21m     10.1.0.130   docker-desktop   <none>           <none>
# orderer4-6647fdccf8-cgmch    1/1     Running   0          21m     10.1.0.131   docker-desktop   <none>           <none>
# org1peer0-69dd4f648f-t8mfr   1/1     Running   0          7m44s   10.1.0.138   docker-desktop   <none>           <none>
# org1peer1-7b8446f47d-pb6tb   1/1     Running   0          7m52s   10.1.0.137   docker-desktop   <none>           <none>
# org2peer0-68f84bcc88-ggrp2   1/1     Running   0          7m24s   10.1.0.139   docker-desktop   <none>           <none>
# org2peer1-5986674c5b-qkbkb   1/1     Running   0          7m19s   10.1.0.140   docker-desktop   <none>           <none>
# rca0-5945f8b558-kql8t        1/1     Running   0          17h     10.1.0.100   docker-desktop   <none>           <none>
# rca1-67bdcf748f-78lzk        1/1     Running   0          17h     10.1.0.101   docker-desktop   <none>           <none>
# rca2-54d76df7b6-6rm2t        1/1     Running   0          17h     10.1.0.102   docker-desktop   <none>           <none>
# tls-ca-65b5858c66-r6tnm      1/1     Running   0          17h     10.1.0.99    docker-desktop   <none>           <none>

# optionally, check the service is correctly bound to pod
kubectl describe pod [pod-id]

# optionally, show logs
kubectl logs -l name=org1peer0

# optionally, check if the persistentVolume is ready
kubectl exec [pod-id] -- ls /var/artifacts

# should output:
# crypto-config
```

### org1 create/join channel
```shell script
# sh to fabric-tools pod
kubectl exec -it fabric-tools bash

# create channel
export CORE_PEER_LOCALMSPID=EtcMSP
export CORE_PEER_ADDRESS=peer0.etradeconnect.net:7051
export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp
peer channel create -c loanapp -f /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/channel.tx -o orderer0.hktfp.com:7050 \
    --outputBlock /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/loanapp.block \
    --tls --cafile /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

# should output:
# 2020-01-29 22:51:55.436 HKT [msp.identity] Sign -> DEBU 08d Sign: plaintext: 0AEA080A1308051A06088BB8C6F10522...5C3D5E779ACD12080A021A0012021A00
# 2020-01-29 22:51:55.436 HKT [msp.identity] Sign -> DEBU 08e Sign: digest: 232DE9C2F9D70A8E75EC158C540FCA41DBD3AD01A712525634C5C80D1AF3E58F
# 2020-01-29 22:51:55.441 HKT [cli.common] readBlock -> INFO 08f Received block: 0

# join channel
export CORE_PEER_LOCALMSPID=EtcMSP
export CORE_PEER_ADDRESS=peer0.etradeconnect.net:7051
export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp
export CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem
peer channel join -b /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/loanapp.block

# should output:
# 2020-01-29 23:16:11.465 HKT [channelCmd] executeJoin -> INFO 03e Successfully submitted proposal to join channel

# update anchor peer <== ERROR
#peer channel update -o orderer0.hktfp.com:7050 -c loanapp -f /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/etcAnchors.tx \
#--tls --cafile /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

export CORE_PEER_ADDRESS=peer1.etradeconnect.net:7151
peer channel join -b /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/loanapp.block

# check channel peers has joined
peer channel list

# should output:
# loanap

exit
```

### org2 join channel
```shell script
kubectl exec -it fabric-tools bash

export CORE_PEER_LOCALMSPID=PbctfpMSP
export CORE_PEER_ADDRESS=peer0.pbctfp.net:7251
export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/PbctfpMSP/admin/msp
export CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem
peer channel join -b /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/assets/loanapp.block

# update anchor peer <== ERROR
#peer channel update -o orderer0.hktfp.com:7050 -c loanapp -f /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/assets/pbctfpAnchors.tx \
#--tls --cafile /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

export CORE_PEER_ADDRESS=peer1.pbctfp.net:7351
peer channel join -b /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/assets/loanapp.block

exit
```


### Install chaincode
```shell script

kubectl exec -it fabric-tools -- mkdir /var/artifacts/chaincode

# todo: build chaincode prod
kubectl cp ../../packages/chaincode/ fabric-tools:/var/artifacts/
```

### Useful commands

```shell script
chmod a+rx /fabric/* -R
kubectl get pod [pod-id] --watch
kubectl logs -f -l app=orderer --all-containers
kubectl top pod POD_NAME --containers
```


### Reference

[Fabric raft deployment on k8s](https://medium.com/@oap.py/deploying-hyperledger-fabric-on-kubernetes-raft-consensus-685e3c4bb0ad)
[sample project](https://github.com/feitnomore/hyperledger-fabric-kubernetes)
