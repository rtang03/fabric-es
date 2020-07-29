#!/bin/bash
# delete secret used for orderer

kubectl -n default delete secret orderer0.org0.com-cert
kubectl -n default delete secret orderer0.org0.com-genesis
kubectl -n default delete secret orderer0.org0.com-key
kubectl -n default delete secret orderer0.org0.com-tls
kubectl -n default delete secret orderer1.org0.com-cert
kubectl -n default delete secret orderer1.org0.com-genesis
kubectl -n default delete secret orderer1.org0.com-key
kubectl -n default delete secret orderer1.org0.com-tls
kubectl -n default delete secret orderer2.org0.com-cert
kubectl -n default delete secret orderer2.org0.com-genesis
kubectl -n default delete secret orderer2.org0.com-key
kubectl -n default delete secret orderer2.org0.com-tls
kubectl -n default delete secret orderer3.org0.com-cert
kubectl -n default delete secret orderer3.org0.com-genesis
kubectl -n default delete secret orderer3.org0.com-key
kubectl -n default delete secret orderer3.org0.com-tls
kubectl -n default delete secret orderer4.org0.com-cert
kubectl -n default delete secret orderer4.org0.com-genesis
kubectl -n default delete secret orderer4.org0.com-key
kubectl -n default delete secret orderer4.org0.com-tls
