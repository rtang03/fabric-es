#!/bin/bash

helm uninstall -n n0 crypto-rca0
helm uninstall -n n0 crypto-tlsca0
helm uninstall -n n0 rca0
helm uninstall -n n0 tlsca0
helm uninstall -n n0 admin0

helm uninstall -n n1 crypto-rca1
helm uninstall -n n1 crypto-tlsca1
helm uninstall -n n1 rca1
helm uninstall -n n1 tlsca1
helm uninstall -n n1 admin1
