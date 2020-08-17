#!/bin/bash

helm uninstall -n n0 crypto-rca0
helm uninstall -n n0 crypto-tlsca0
helm uninstall -n n0 rca0
helm uninstall -n n0 tlsca0
helm uninstall -n n0 admin0
