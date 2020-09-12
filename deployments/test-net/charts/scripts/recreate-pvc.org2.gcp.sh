#!/bin/bash
. ./setup.sh
kubectl -n n2 delete -f ../releases/org2/volumes/pvc-org2.gcp.yaml --wait=true
kubectl -n n2 delete -f ../releases/org2/volumes/pvc-p0o2.gcp.yaml --wait=true
kubectl -n n2 delete -f ../releases/org2/volumes/pvc-gupload2.gcp.yaml --wait=true

kubectl -n n2 create -f ../releases/org2/volumes/pvc-org2.gcp.yaml
kubectl -n n2 create -f ../releases/org2/volumes/pvc-p0o2.gcp.yaml
kubectl -n n2 create -f ../releases/org2/volumes/pvc-gupload2.gcp.yaml
