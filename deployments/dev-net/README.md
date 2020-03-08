## Overview

_dev-net_ is a core deployment network for below purposes:

- act as local development environment of Fabric (DONE)
- provide a running Fabric for CI execution
- provide configuration files, for creating docker images
- provide configuration files, for k8s

### Fabric Networks

It aims to offer 3 types of network configurations.

1. `compose.2org.yaml`  
   peer0-etradeconnect, peer0-pbctfp, orderer0-hktfp, postgres01, postgres02, cli, tls-ca, rca0, rca1, rca2
2. `compose.2org.yaml`  
   peer0-etradeconnect, peer0-pbctfp, peer0-hktfp, orderer0-hktfp, postgres01, postgres02, postgres03, cli, tls-ca, rca0, rca1, rca2, rca3
3. `compose.full.yaml`  
   3 orgs; 5 orderers

### Instructions

_Scenario 1: Local development mode using `run-dev-net.sh`_

- launch the local development network: `compose.2org.yaml`.

Rebuild the Fabric development network

- run `shutdown-cleanup.sh` to (a) shutdown the running network, (b) remove _artifacts_ subdirectory, (c) kill docker containers
- run `run-dev-net.sh` again.

_Scenario 2: Run local unit test using`run-unit-test.sh`_

- launch the same network `compose.2org.yaml`
- run unit tests in local machine, for unit test development
- clean up the network
