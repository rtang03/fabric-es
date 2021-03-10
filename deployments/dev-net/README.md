## Overview

_dev-net_ is a core deployment network for below purposes:

- act as local development environment of Fabric (DONE)
- provide a running Fabric for CI execution
- provide configuration files, for creating docker images
- provide configuration files, for k8s

### Fabric Networks

It aims to offer 2 types of network configurations.  

_Type 1_  
For development of authentication server WITHOUT Fabric network, there are the compose files:

- `compose.db-red.yaml` deploys 1 x postgres database, 1 x redis ram database
- `compose.auth.yaml` deploys 1 x auther-server containers

_Type 2_  
For development of gw-org WITH Fabric network up to ***n*** nodes, via multiple steps compose file execution:

1. `compose.orderer.yaml`  
   - cli, tls-ca-org0, rca-org0, orderer-org[0..4]
1. `compose.org.yaml`  
   - rca-org[1..n], peer-org[1..n]
1. `compose.db-red.yaml`
   - add: postgres[1..n], redis[1..n] 
1. `compose.cc.yaml`
   - add: eventchaincc[1..n]
1. `compose.auth.yaml`
   - add: auth-server[1..n]
1. `compose.1org.gw.yaml` `compose.2org.gw.yaml` `compose.3org.gw.yaml`
   - add: gw-org1, gw-org2, gw-org3
1. `compose.tester.yaml`
   - add: tester

### Instructions for Local Developement

_Scenario 1a: Local development mode for Auth-Server using `dn-run.sh`_

- with shellscript [dn-run.sh](dn-run.sh) 
```shell script
./dn-run.sh 0
```
- launch [bootstrap_zero.sh](bootstrap_zero.sh)
  - launch [cleanup.sh](cleanup.sh) to 
    1. shutdown the running network, 
    1. remove _artifacts_ subdirectory
    1. kill docker containers
  - launch [build-config.sh](build-config.sh) to generate
    1. [docker compose file](#Fabric-Networks) with postgre, redis
  - launch the postgres db redis for auth server : `compose.org.db-red.yaml`
- for develop auth-server (_gw-org_)

_Scenario 1b: Local development mode for gw-org using `dn-run.sh`_

- with shellscript [dn-run.sh](dn-run.sh) up to ***n*** nodes (from 1 to 9)
```shell script
./dn-run.sh n auth
```
- launch [bootstrap_supp.sh](bootstrap_supp.sh)
  - launch [cleanup.sh](cleanup.sh) to 
    1. shutdown the running network, 
    1. remove _artifacts_ subdirectory
    1. kill docker containers
  - launch [build-config.sh](build-config.sh) to generate
    1. config file for [bootstrap.sh](bootstrap.sh) and 
    1. [docker compose file](#Fabric-Networks) with ***n*** organizations
  - launch [bootstrap.sh](bootstrap.sh) for local development network include
    1. the tls-ca, rca-0 and orderer-org for core of dev-net : `compose.orderer.yaml` 
    1. the peer and rca of up to ***n*** organizations for the rest of dev-net : `compose.org.yaml`
    1. the eventchain code for each organization : `compose.cc.yaml` 
  - launch the postgres db for auth server and redis for query : `compose.org.db-red.yaml`
  - launch the auth server : `compose.auth.yaml` 
- for develop micro services of organization gateway (_gw-org_)

_Scenario 2: Run local unit test using `dn-run.sh`_

- with shellscript [dn-run.sh ***n*** gw-org test](dn-run.sh) up to ***n*** nodes (either 2 or 3)
```shell script
./dn-run.sh n gw-org test
```
- launch the same network as _Scenario 1b_
- in addition launch ***n*** _gw-org_(s) with micro services `compose.1org.gw.yaml` `compose.2org.gw.yaml` `compose.3org.gw.yaml`
- used for run the integration test in _tester_ package for _gw-org_
- _required _gw-org_ ***n*** image(s) mentioned in Scenario 3_
- _required _tester_ image(s) mentioned in Scenario 4_

_Scenario 3: Build docker images for all gw-orgs with `dn-build.gw.sh`_

- with shellscript [dn-build.gw.sh](dn-build.gw.sh) 
```shell script
./dn-build.gw.sh org1 org2 org3
```
- clean up the network
- compile and build the package _gw_org1_, _gw_org2_ and _gw_org3_
- produce _gw_org1_, _gw_org2_ and _gw_org3_ docker images

_Scenario 4: Build docker image for test with [dn-build.tester.sh](dn-build.tester.sh)_

- with shellscript [dn-build.tester.sh](dn-build.tester.sh) 
```shell script
./dn-build.tester.sh
```
- clean up the network
- compile and build the package _tester_
- produce _tester_ docker image
- run unit test
- run integration test

After launch, use below links for local development:

- Goto gw-org1 `http://localhost:4001/graphql`
- Goto auth-server1, with either `http://localhost:3001` or `http://localhost:3001/graphql`
- Goto gw-org2 `http://localhost:4002/graphql`
- Goto auth-server2, with either `http://localhost:3002` or `http://localhost:3002/graphql`
- Goto gw-org3 `http://localhost:4003/graphql`
- Goto auth-server3, with either `http://localhost:3003` or `http://localhost:3003/graphql`


After use, you may use below command to tear down the network:

```shell script
./clean.sh
```

### Useful Commands

```shell script
# Remove docker container with status=exited
docker rm -f \$(docker ps -aq -f status=exited)

# Remove all docker containers
docker rm -f (docker ps -aq)

# Remove all docker images
docker rmi -f (docker images -q)

# LiSt Open Files
sudo lsof -P -sTCP:LISTEN -i TCP -a -p 5432
sudo lsof -i :5432
```

### References

- [Node, pm2 dockers devops](https://medium.com/@adriendesbiaux/node-js-pm2-docker-docker-compose-devops-907dedd2b69a)

- [pm2 documentation](https://pm2.keymetrics.io/docs/usage/application-declaration/)

### Todo: implement trigger, so that cli can run reconcile, cleanup action

TBD
https://pm2.keymetrics.io/docs/usage/process-actions/
pm2 trigger <application-name> <action-name> [parameter]
https://linuxize.com/post/nginx-reverse-proxy/
