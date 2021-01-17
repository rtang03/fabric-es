### Features

- Hyperledger Fabric High Level Contract API
- External chaincode launcher
- Event sourcing / CQRS pattern
- Domain driven design
Apollo API Federation

Clean Architecture

## Technical Components

This project is built with monorepo, primarily written in Typescript.

### Part 1 - Deployments

Under directory `deployments`, it contains different ways of bootstraping the Fabric network.

1. _dev-net_ is a multiple purpose, for local development of library code & reference implementation.

After successful deployment, the starting development network is basically 3-org x 1 peer; 5 CA; Raft or solo orderer; 1 x cli.

_Bootstrap base network_  
Bootstrap the base network, according to [`./deployments/README.md`](deployments/README.md)

### Part 2 - Library packages

Below are library codes which will be packaged as npm packages. As an interim arrangement, each package will be (manually)
published to GitHub Packages. Future plan will be published to both GitHub Packages, and npm registry.

#### packages/authentication

This package is dual-purposes; (a) offer library function, for gateway implementation; or (b) acts a authentication server.
(a) is mostly used for local development, along with other packages. (b) A typical use case will build this package as a
docker image, as _auth-server_. It offers user management, user on-boarding, and OAuth2 server functionality.

#### packages/example

This is using simple counter example, to submit transaction, via Peer object, given by fabric-cqrs software library.
It serves smoke test, to validate running network. The CI/CD may use this example to validate successful deployment.

#### packages/fabric-cqrs

This package implements **Repository Pattern** for Hyperleder Fabric; is a data service layer. It provides repository API, for
reading and writing commits. It also realizes CQRS pattern, via Redux library.

#### packages/gateway-lib

This package offers strongly typed API gateway capability by Apollo Gateway server. Leverage _fabric-cqrs_, it invoke transaction
onto Fabric. The gateway-lib creates different types of micro-service in form of Apollo federated services; and those
federated service will be meshed up via Apollo Gateway.

#### packages/operator

This package performs administrative tasks of Fabric network operator. It can perform:

- Create channel
- Join peers of all the organizations to this channel
- Install the chaincode on every peer joined to the channel
- Instantiate the chaincode on this channel
- Register and enrol new user, and create file system wallet

There are two ways to conduct administrative tasks

1. use npm script, to create channel/install chaincode/instantiate chaincode
2. serve other private packages, as if npm packages; being imported by _gateway-lib_

### Part 3 - Reference implementation packages

Reference implementation is used for (a) library package development, and (2) acts a code sample for project boilerplate.

#### packages/model-\*

This package is a collection Domain-Driven Models.

#### packages/gw-org\*

This package is a collection organizational gateways.

## Getting Started

### Bootstrap development network

Goto [~/deployments/dev-net](./deployments/dev-net/README.md), pick the development scenario to start with.

## Notes on dependencies

### Development Scenario: operator

- Require a running Fabric/CA
- No dependency with other packages
- May involve frequent network restart
- May re-install network and/or CAs

### Development Scenario: Chaincode

- Require a running Fabric/CA
- No dependency with other packages
- May involve frequent chaincode upgrade
- Do not require to re-install CAs

### Development Scenario: model-*

- Do not require running Fabric/CA
- No dependency with other packages

### Development Scenario: example

- Do not expect active development

### Development Scenario: fabric-cqrs

- Require a running Fabric/CA
- Dependent on _operator_
- May involve frequent chaincode upgrade
- Occasionally network restart
- Do not require to re-install CAs
- Require enrollAdmin and enrollCaAdmin

### Development Scenario: gateway-lib

- Require a running Fabric/CA
- Dependent on _operator_, _fabric-cqrs_
- Do not require chaincode upgrade
- Rare network restart
- Do not require to re-install CAs
- Require enrollAdmin and enrollCaAdmin

### Development Scenario: gw-org*

- Require a running Fabric/CA
- Dependent on _operator_, _fabric-cqrs_, _gateway-lib_
- Do not require chaincode upgrade
- Rare network restart
- Do not require to re-install CAs
- Require enrollAdmin and enrollCaAdmin
- Require a running Postgresql

