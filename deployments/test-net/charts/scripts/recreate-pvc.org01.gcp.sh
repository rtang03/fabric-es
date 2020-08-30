#!/bin/bash
. ./setup.sh
kubectl -n n1 delete -f ../releases/org1/volumes/pvc-org1.gcp.yaml --wait=true
kubectl -n n0 delete -f ../releases/org0/volumes/pvc-org0.gcp.yaml --wait=true
kubectl -n n0 delete -f ../releases/org0/volumes/pvc-orderers.gcp.yaml --wait=true
kubectl -n n1 delete -f ../releases/org1/volumes/pvc-p0o1.gcp.yaml --wait=true

kubectl -n n1 create -f ../releases/org1/volumes/pvc-org1.gcp.yaml
kubectl -n n0 create -f ../releases/org0/volumes/pvc-org0.gcp.yaml
kubectl -n n0 create -f ../releases/org0/volumes/pvc-orderers.gcp.yaml
kubectl -n n1 create -f ../releases/org1/volumes/pvc-p0o1.gcp.yaml
