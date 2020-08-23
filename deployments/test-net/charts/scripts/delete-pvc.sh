#!/bin/bash
. ./scripts/setup.sh

kubectl -n n1 delete -f ./releases/org1/volumes/pvc-org1.local.yaml
