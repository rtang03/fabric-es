![CI](https://github.com/rtang03/open-platform-dlt/workflows/CI/badge.svg?branch=master)
![Build Images](https://github.com/rtang03/open-platform-dlt/workflows/Build%20Images/badge.svg)

## Project Overview

This package aims to implement basic commands for bootstrap Trade platform. This middleware fucntiona shall later enable
to develop more robust Trade Industry Blockchain-as-a-service platform.

### Part 1 - Bootstrap Fabric network, with Fabric CA

Under directory `network`, it bootstrap the Fabric network and Fabric CA.

It deploys _Development Network_ with docker-compose. Based on `configtx.yaml`, it produces `config.tx`.

After successful deployment, the development network will be created at `network/hosts`. And, all programs under `packages`
will use it. The deployment is performed with shell script.

_Bootstrap base network_  
Bootstrap the base network, according to [`./network/READMD.md`](_archive/network/README.md)  
This will build the 2-orgs/4-peers/4-CA topology. And, register/enrol:

- TLS CA admin
- Org1 & Org 2 Root CA admins
- Org1 & Org2 admins

### Part 2a - Admin Tool

Under directory `packages/admin-tool`, it uses `fabric-client` sdk, to conduct administrative tasks.

It can perform:

- Create channel
- Join peers of all the organizations to this channel
- Install the chaincode on every peer joined to the channel
- Instantiate the chaincode on this channel
- Register and enrol new user, and create file system wallet

There are two ways to conduct administrative tasks

1. use npm script, to create channel/install chaincode/instantiate chaincode
2. serve other private packages, as if npm packages.

### Part 2b - chaincode

This chaincode is written based v1.4.x new programming model, containing _eventstore_ and _privatedata_ chaincodes.

### Part 2c - common

This is a software library, containing solely Domain Driven Models. Following Onion architecture, this is inner core of the
onion. It has zero knowledge of technical implementation. Models will be publicly shared amongst banks.

### Part 2d - fabric-cqrs

This is a software library, for invokeing event sourced commits, into Hyperledger.

### Part 2e - peer-node

This is a NodeJS application for Hyperledger peer. It provisions data services, via Apollo Gateway server. It
replies on fabric-cqrs, to submit and evaluate transaction. The data services is the realization of DDD models, which
imports from package `common`. It will additionally realize _privatedata_ model. The _privatedata_ will be different for
different organization. And, therefore, peer-node here provides reference implmentation.

For simple topology, we implment one peer-node for different banks. In this case, different _privatedata_ models of
different banks coexist.

For complex topology, it can be different peer-node for different banks.

### Part 2f - example

This is using simple counter example, to submit transaction, via Peer object, given by fabric-cqrs software library.
It serves smoke test, to validate running network. The CI/CD may use this example to validate successful deployment.

### Part 2g - application

This is middle-tier application. Bank's unique requirement, e.g. authentication, should be implemented here. Each organization
should have only a single application. `application` and `peer-node` is customer-supplier relationship. One application may
obtain data service from (a) peer-node of the same organization, or (b) from different organizations, or (c) or a combined
use of both.

For PwC POC, there will be 2 applications,_app-etc_ and _app-erp_.

## Development Workflow

### Step 0: Clean up Fabric Network

If there is pre-existing newtwor,, can use below commands, to clean up.

_Clean up command_

```shell script
docker volume prune
docker rm $(docker ps -qf "name=cli-org") -f
docker rm $(docker ps -aqf "name=eventstore") -f
docker rm $(docker ps -aqf "name=privatedata") -f
docker rmi $(docker images -q "dev-*")
```

If this is repeated installation, clean up will remove the Hyperledger network, but it does NOT remove the previously
installed CAs.

If you want to cleanup/reinstall CA, simply remove `network/hosts` directory.

### Step 1: Setup the network

Perform the _Mandatory Step_ in below.
[Preparing Nework and CAs](https://github.com/rtang03/open-platform-dlt/tree/master/network/README.md)

Note that: you need NOT perform the optional step: Manually create channel/install CC/instantiate CC/join channel

### Step 2: Yarn Installation

At project root, run `yarn`, to install dependencies.

Then, build the software library in packages of `common`, `fabric-cqrs`, `admin-tool` and `peer-node`, by
running `yarn build` in their corresponding directories.

### Step 3: Build chaincode

Like above, build the chaincode, by running `yarn build` in chaincode directory.

### Step 4a: Create Channel/Install/instantiate chaincode

At `packages/admin-tool`, run

- `yarn run test:install-instantiate-eventstore`. After it is done, and continue.
- `yarn run test:install-instantiate-privatedata`

Note:

- Cannot run in parallel.
- Above will install/instantiate version 0 chaincodes.
- If there is pre-existing docker images of chaincode of version 0, it will re-use it, instead of deploying the new one.
  Therefore, for chaincode development, make sure to clean up. For non chaincode development, clean up is optional.

### Step 4b: Upgrade chaincode

For chaincode development, it is more convenient, you need NOT do fresh installation (begining with step 0/1).
You may repeat Step 3, and then directly go Step 4b.

At `packages/admin-tool`, run

- `yarn run test:install-upgrade-eventstore`. AND/OR
- `yarn run test:install-upgrade-privatedata`

Note:

- Two chaincodes need not upgrade together. They can be upgraded independently, and installed different version.
- upgrade will increment the version number
- upgrade will create additional docker container, and docker images

Optionally, if you want to validate the chaincode installation, at `packages/chaincode`, run `yarn run test:public-integration`

_INSTALLATION DONE HERE_

## Special Attention

### Development Scenario: Admin Tool

- Require a running Fabric/CA
- No dependency with other packages
- May involve frequent network restart
- May re-install network and/or CAs

### Development Scenario: Chaincode

- Require a running Fabric/CA
- No dependency with other packages
- May involve frequent chaincode upgrade
- Do not require to re-install CAs

### Development Scenario: common

- Do not require running Fabric/CA
- No dependency with other packages

### Development Scenario: example

- Do not expect active development

### Development Scenario: fabric-cqrs

- Require a running Fabric/CA
- Dependent on admin-tool
- May involve frequent chaincode upgrade
- Occasionally network restart
- Do not require to re-install CAs
- Require enrollAdmin

### Development Scenario: peer-node

- Require a running Fabric/CA
- Dependent on admin-tool, fabric-cqrs
- Do not require chaincode upgrade
- Rare network restart
- Do not require to re-install CAs
- Require enrollAdmin

### Development Scenario: application

- Require a running Fabric/CA
- Require a running peer-node
- Dependent on admin-tool, peer-node
- Do not require chaincode upgrade
- Rare network restart
- Do not require to re-install CAs
- Require enrollAdmin
- (Future) may require a running Postgresql

### Tear down

To tear a running network, following below steps:

Quit the `./monitordocker.sh`, by CTRL-C

```shell script
docker rm logspout -f

// cd project-root/network
docker-compose down

// if chaincode re-install/upgrade required, run both commands below
docker rm $(docker ps -aqf "name=dev") -f
docker rmi $(docker images -q "dev-*")
```

Above step does not tear down CAs.

### References

Some source is refactored from below repo.  
[Sample Code - 1](https://github.com/kevin-hf/kevin-fabric-sdk-node)  
[IBM Sample Code - 2](https://github.com/PacktPublishing/Handson-Blockchain-Development-with-Hyperledger)  
[ampretia sample](https://github.com/ampretia/fabric-application-examples)
[sample monorepo build](https://github.com/benawad/fullstack-graphql-airbnb-clone)

Note that Kelvin's sample is using high level API, but incomplete operational tasks. IBM samples is low level API, but more complete
operational task.
