Deployment
==========

.. sidebar:: Our Deployment Goal

     - DevSecOps with GitOps
     - Immutable deployment
     - Cloud Native - K8S with Istio
     - Multiple cloud

Table of Contents
-----------------

1. `Dev-net`_
    1. `Fabric network`_
    2. `Instructions for local development`_
    3. `Useful command`_

2. `Test-net`_

Dev-net
-------

`dev-net` provisions different development networks, based on docker-compose, so that:

  - act as local development environment of Fabric
  - provide a running Fabric for CI execution
  - provide configuration files, for creating docker images
  - provide starting configuration files, for k8s

Fabric network
~~~~~~~~~~~~~~

It aims to offer 2 types of network configurations.

**Type 1**

For development of authentication server WITHOUT Fabric network, there are the compose files:

  - `compose.db-red.yaml` deploys 1 x postgres database, 1 x redis store
  - `compose.auth.yaml` deploys 1 x auth-server containers

**Type 2**

For development of `gw-org` with Fabric network up to ***n*** nodes, via multiple steps `docker-compose` file execution:

  1. `compose.orderer.yaml`

     - cli, tls-ca-org0, rca-org0, orderer-org[0..4]

  2. `compose.org.yaml`

     - rca-org[1..n], peer-org[1..n]

  3. `compose.db-red.yaml`

     - add: postgres[1..n], redis[1..n]

  4. `compose.cc.yaml`

     - add: eventchaincc[1..n]

  5. `compose.auth.yaml`

     - add: auth-server[1..n]

  6. `compose.1org.gw.yaml` `compose.2org.gw.yaml` `compose.3org.gw.yaml`

     - add: gw-org1, gw-org2, gw-org3

  7. `compose.tester.yaml`

     - add: tester

Instructions for local development
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

**Scenario 1a: Development for custom auth-server using dn-run.sh**

.. warning:: *Scenario 1a* will be deprecated shortly.

Use shell script `dn-run.sh <https://github.com/rtang03/fabric-es/blob/master/deployments/dev-net/dn-run.sh>`__

.. code:: bash

    cd deployments/dev-net
    ./dn-run.sh 0

- Launch `bootstrap_zero.sh <https://github.com/rtang03/fabric-es/blob/master/deployments/dev-net/bootstrap_zero.sh>`__

  - Launch `cleanup.sh <https://github.com/rtang03/fabric-es/blob/master/deployments/dev-net/cleanup.sh>`__

    1. shutdown the running network, if any
    2. remove *artifacts* subdirectory
    3. kill docker containers

  - Launch `build-config.sh <https://github.com/rtang03/fabric-es/blob/master/deployments/dev-net/build-config.sh>`__ to generate

    1. docker compose files for `Fabric network`_, with postgres and redis

  - Launch postgres & redis for auth-server: `compose.org.db-red.yaml`

- for develop auth-server (*gw-org*)

**Scenario 1b: Local development mode for gw-org using dn-run.sh**

Use shell script `dn-run.sh <https://github.com/rtang03/fabric-es/blob/master/deployments/dev-net/dn-run.sh>`__
that supports up to ***n*** nodes (from 1 to 9) with command

.. code:: bash

    ./dn-run.sh n auth

- Launch `bootstrap_supp.sh <https://github.com/rtang03/fabric-es/blob/master/deployments/dev-net/bootstrap_supp.sh>`__

  - Launch `cleanup.sh <https://github.com/rtang03/fabric-es/blob/master/deployments/dev-net/cleanup.sh>`__

    1. shutdown the running network
    2. remove *artifacts* subdirectory
    3. kill docker containers

  - Launch `build-config.sh <https://github.com/rtang03/fabric-es/blob/master/deployments/dev-net/build-config.sh>`__ to generate

    1. config file for `bootstrap.sh <https://github.com/rtang03/fabric-es/blob/master/deployments/dev-net/bootstrap.sh>`__, and
    2. docker compose files for `Fabric network`_, with ***n*** organizations

  - Launch `bootstrap.sh <https://github.com/rtang03/fabric-es/blob/master/deployments/dev-net/bootstrap.sh>`__
    for local development network, including

    1. the tls-ca, rca-0 and orderer-org for core of dev-net : `compose.orderer.yaml`
    2. the peer and rca of up to ***n*** organizations for the rest of dev-net : `compose.org.yaml`
    3. the eventchain code for each organization : `compose.cc.yaml`

  - Launch the postgres db for auth server and redis for query : `compose.org.db-red.yaml`

  - Launch the auth server : `compose.auth.yaml`

- for development of federated gateway (*gw-org*)

**Scenario 2: Run local unit test using dn-run.sh**

Use shell script `dn-run.sh <https://github.com/rtang03/fabric-es/blob/master/deployments/dev-net/dn-run.sh>`__
that support up to ***n*** nodes (either 2 or 3) with command

.. code:: bash

    ./dn-run.sh n gw-org test

- Launch the same network as Scenario 1b

- Launch ***n*** *gw-org* with `compose.1org.gw.yaml` `compose.2org.gw.yaml` `compose.3org.gw.yaml`

- Used for run the integration test in *tester* package for *gw-org*

- required *gw-org* ***n*** image(s) mentioned in Scenario 3

- required *tester* image(s) mentioned in Scenario 4

**Scenario 3: Build docker images for all gw-orgs with dn-build.gw.sh**

Use shell script `dn-build.gw.sh <https://github.com/rtang03/fabric-es/blob/master/deployments/dev-net/dn-build.gw.sh>`__
with command

.. code:: bash

    ./dn-build.gw.sh org1 org2 org3

- Clean up the network

- Compile and build the package *gw_org1*, *gw_org2* and *gw_org3*

- Produce *gw_org1*, *gw_org2* and *gw_org3* docker images

**Scenario 4: Build docker image for test with dn-build.tester.sh**

Use shell script `dn-build.tester.sh <https://github.com/rtang03/fabric-es/blob/master/deployments/dev-net/dn-build.tester.sh>`__
with command

.. code:: bash

    ./dn-build.tester.sh

- Clean up the network

- Compile and build the package *tester*

- Produce _tester_ docker image

- Run unit test

- Run integration test

After launch, use below links for local development:

- Goto gw-org1 `http://localhost:4001/graphql`

- Goto auth-server1, with either `http://localhost:3001` or `http://localhost:3001/graphql`

- Goto gw-org2 `http://localhost:4002/graphql`

- Goto auth-server2, with either `http://localhost:3002` or `http://localhost:3002/graphql`

- Goto gw-org3 `http://localhost:4003/graphql`

- Goto auth-server3, with either `http://localhost:3003` or `http://localhost:3003/graphql`

After use, you may use below command to tear down the network:

.. code:: bash

    ./cleanup.sh

Useful command
~~~~~~~~~~~~~~

.. code:: bash

    # Remove docker container with status=exited
    docker rm -f \$(docker ps -aq -f status=exited)

    # Remove all docker containers
    docker rm -f (docker ps -aq)

    # Remove all docker images
    docker rmi -f (docker images -q)

    # List Open Files
    sudo lsof -P -sTCP:LISTEN -i TCP -a -p 5432
    sudo lsof -i :5432

Test-net
--------

Under construction.

The test-net will be built with Kubernetes + Istio + ArgoCD; with `GitOps <https://www.gitops.tech/>`__ included.

