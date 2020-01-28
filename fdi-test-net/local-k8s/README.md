```shell script
# copy cryto-material into k8s persistentVolume 
# todo: to be replaced by kubectl cp 
cp -R ../network2/artifacts/crypto-config /tmp/data

kubectl exec -it fabric-tools -- mkdir /var/artifacts/chaincode

# todo: build chaincode prod
kubectl cp ../../packages/chaincode/ fabric-tools:/var/artifacts/
```

```shell script
# sh to org1peer0
kubectl exec -it [org1peer0 Pod] bash
```

```shell script
# create channel
export CORE_PEER_ADDRESS=peer0.etradeconnect.net:7051
export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp
peer channel create -c loanapp -f /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/channel.tx -o orderer0.hktfp.com:7050 \
    --outputBlock /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/loanapp.block \
    --tls --cafile /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

# join channel
peer channel join -b /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/loanapp.block
```

### Useful commands

```shell script
kubectl get pods --output=wide
kubectl get pod [Pod] --watch
kubectl get svc
kubectl logs [Pod]
```

### Reference

[Fabric raft deployment on k8s](https://medium.com/@oap.py/deploying-hyperledger-fabric-on-kubernetes-raft-consensus-685e3c4bb0ad)
[sample project](https://github.com/feitnomore/hyperledger-fabric-kubernetes)
