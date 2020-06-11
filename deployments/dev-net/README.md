## Overview

_dev-net_ is a core deployment network for below purposes:

- act as local development environment of Fabric (DONE)
- provide a running Fabric for CI execution
- provide configuration files, for creating docker images
- provide configuration files, for k8s

### Fabric Networks

It aims to offer 3 types of network configurations.  
_Part A_

For development of authentication server WITHOUT Fabric network, there is one compose file:

- `compose.auth-server.yaml` deploys 1 x postgres database, and 1 x auther-server containers
- (TBC) as a future scenario, it may additionally a tester container, for integration test.

_Part B_  
For development of auth-server, gw-org WITH Fabric network, via multiple steps compose file execution:

1. `compose.1.2org.yaml`  
   peer0-etradeconnect, peer0-pbctfp, orderer0-hktfp, postgres01, postgres02, cli, tls-ca, rca0, rca1, rca2
1. `compose.2.2org.auth.yaml`
   - add: auth-server1, auth-server2
1. `compose.3.2org.auth-gw.yaml`
   - add: gw-org1, gw-org2
1. `compose.4.2org.auth-gw-tester.yaml`
   - add: tester

### Instructions for Local Developement

_Scenario 1: Local development mode using `run-dev-net.sh`_

- launch the local development network: `compose.1.2org.yaml`

Or alternatively rebuild the Fabric development network

- run `shutdown-cleanup.sh` to (a) shutdown the running network, (b) remove _artifacts_ subdirectory, (c) kill docker containers
- run `run-dev-net.sh` again.

_Scenario 2: Run local unit test using`run-unit-test.sh`_

- launch the same network `compose.1.2org.yaml`
- run unit tests in local machine, for unit test development
- no clean up the network, after launch
- used for _auth-server_ development

_Scenario 3: Build docker image for auth server with`build-run-auth-server`_

- launch `compose.auth-server.yaml`, for 1 postgres and 1 auth-server
- do not run unit test
- no clean up the network, after launch
- produce _auth-server_ docker image

_Scenario 4: Build docker images for all components wtih `build-run-3.2org.auth-gw-tester.sh`_

- launch `compose.4.2org.auth-gw-tester.yaml`
- run unit test
- run integration test
- no clean up the network, after launch
- produce _auth-server_ _gw-org1_ _gw-org2_ docker images
- this is used for local execution, for CI workflow development

After launch, use below links for local development:

- Goto gw-org1 `http://localhost:4011/graphql`
- Goto auth-server1, with either `http://localhost:3901` or `http://localhost:3901/graphql`
- Goto gw-org2 `http://localhost:4012/graphql`
- Goto auth-server2, with either `http://localhost:3902` or `http://localhost:3902/graphql`

After use, you may use below command to tear down the network:

```shell script
docker-compose -f compose.4.2org.auth-gw-tester.yaml down
```

### Useful Commands

```shell script
docker rm -f \$(docker ps -aq -f status=exited)

sudo lsof -P -sTCP:LISTEN -i TCP -a -p 5432
sudo lsof -i :5432
```

### References

[Node, pm2 dockers devops](https://medium.com/@adriendesbiaux/node-js-pm2-docker-docker-compose-devops-907dedd2b69a)
[pm2 documentation](https://pm2.keymetrics.io/docs/usage/application-declaration/)

### Todo: implement trigger, so that cli can run reconcile, cleanup action

TBD
https://pm2.keymetrics.io/docs/usage/process-actions/
pm2 trigger <application-name> <action-name> [parameter]
https://linuxize.com/post/nginx-reverse-proxy/
