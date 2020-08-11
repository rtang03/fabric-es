#!/bin/bash

helm uninstall admin1 -n n1
sleep 2
helm uninstall rca1 -n n1
sleep 2
helm uninstall tlsca1 -n n1
sleep 2
helm uninstall p0o1db -n n1
sleep 2
helm uninstall p0o1 -n n1
