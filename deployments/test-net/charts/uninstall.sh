#!/bin/bash

helm uninstall o0 -n n0
sleep 2
helm uninstall o1 -n n0
sleep 2
helm uninstall o2 -n n0
sleep 2
helm uninstall o3 -n n0
sleep 2
helm uninstall o4 -n n0
sleep 2
helm uninstall admin0 -n n0
sleep 2
helm uninstall rca0 -n n0
sleep 2
helm uninstall tlsca0 -n n0
sleep 2
helm uninstall admin1 -n n1
sleep 2
helm uninstall rca1 -n n1
sleep 2
helm uninstall tlsca1 -n n1
sleep 2
helm uninstall p0o1db -n n1
sleep 2
