![CI](https://github.com/rtang03/open-platform-dlt/workflows/CI/badge.svg?branch=master)
![Create Release](https://github.com/rtang03/fabric-es/workflows/Create%20Release/badge.svg)
![Changelog](https://github.com/rtang03/fabric-es/workflows/Changelog/badge.svg)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

NOTE: README is out-of-date

# Project Overview

This project aims to provide event-driven architecture for Hyperledger Fabric projects. It shall offer technical capabilities
to transit from data-driven architecture to event-driven architecture, via a collection of library packages.

## Technical Components

This project is built with monorepo, primarily written in Typescript.

### Part 1 - Deployments

Under directory `deployments`, it contains different ways of bootstraping the Fabric network.

1. _dev-net_ is a multiple purpose, for local development of library code & reference implementation.
2. _app-net_ is made for _prod-like_ deployment, at public cloud, Google Cloud Platform.
3. _gw-test-net_ is an experimental deployment, based on k8s. It will later be refacotored to consolidate with _dev-net_.

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

#### packages/chaincode

Chaincodes are written based v1.4.x new programming model, containing _eventstore_ and _privatedata_ chaincodes.
_eventstore_ reads and writes events, in form of event commits, as on-chain (public) data. The on-chain data is stored in a
channel; therefore, it is visible amongst organizations. _privatedata_ reads and writes data to Hypereledger private data ledger. It
is also a ledger data, but non-shareable between organization.

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

#### packages/mode-\*

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

### References

Some source is refactored from below repo  
- [Sample Code - 1](https://github.com/kevin-hf/kevin-fabric-sdk-node)  
- [IBM Sample Code - 2](https://github.com/PacktPublishing/Handson-Blockchain-Development-with-Hyperledger)  
- [ampretia sample](https://github.com/ampretia/fabric-application-examples)
- [sample monorepo build](https://github.com/benawad/fullstack-graphql-airbnb-clone)
