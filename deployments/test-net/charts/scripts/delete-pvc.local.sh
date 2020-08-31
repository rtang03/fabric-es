#!/bin/bash
. ./setup.sh
kubectl -n n0 delete -f ../releases/org0/volumes/pvc-org0.local.yaml
kubectl -n n0 delete -f ../releases/org0/volumes/pvc-orderers.local.yaml
kubectl -n n1 delete -f ../releases/org1/volumes/pvc-org1.local.yaml
kubectl -n n1 delete -f ../releases/org1/volumes/pvc-p0o1db.local.yaml
kubectl -n n1 delete -f ../releases/org1/volumes/pvc-p0o1.local.yaml
