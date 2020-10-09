## [0.6.6] - 2020-10-9
### Modified
- improved release to publish to docker hub

## [0.6.5] - 2020-8-18
### Modified
- debugged version - replay package
- splitt reply package

## [0.6.4] - 2020-8-18
### Added
- relay package with sniffer code

## [0.6.3] - 2020-8-4
### Added
- tracking between private and public info
- pagination
- relay package
- queryHandler package
- full text search
- parametric search
- apollo-subscription
- redis-based queryDatabase
- add refreshToken in auth server and ui-control
- add synchroize logout
- add notification
- add sniffer code

### Modified
- dev-net to using queryHandler
- replace "getProjection" function with "find" function

### Broken
- dn-test.3.sh is broken. Need to fix later.

### Removed
- projectionDatabase

## [0.6.2] - 2020-4-10
### Added
- GraphQL resolver APIs for searching the projectionDb
- Docker image versions follows release versions
- reverse proxy
- ui-account for user management
- revamp auth server
- update dev-net to include proxy, ui-account, redis
- ci workflow can run "auth", "gateway-lib" unit test
- update some dependency
- upgrade to Fabric V2.1

### Modified
- Fix v2 related changes in dev-net to work with 3x orgs

## [0.6.1] - 2020-4-10
### Added
- dev-net runs both 2x and 3x orgs
- multi-org integration tests

### Modified
- upgrade to Fabric v2
- change from OR to AND endorsement policy

### Remove
- remove Ngac
- disable image publishing to Google registry

## [0.5.16] - 2020-4-3
### Added
- update for pwc reference implementation 

## [0.5.15] - 2020-3-18
### Added
- fabric-running network to unit and integration tests 
- unit/int test to _create image_ & _ci_ workflow
- new package tester
- add dev-net replacing lib-dev-net
- PR #8

### Removed
- boilerplate.tar.gz from new release creation

### Limitation
- cannot "npm rebuild grpc" to right version; therefore fabric-cqrs test are tentatively removed #12

## [0.5.14] - 2020-3-13
### Added
- repo rename
- add unit and integration tests to _create image_ workflow
- publish npm packages

## [0.5.13] - 2020-3-2
### Added
- include boilerplate.tar.gz to release artefact
- new CI workflow

## [0.5.12] - 2020-3-2
### Added
- Debug only

## [0.5.11] - 2020-3-2
### Added
- Debug only

## [0.5.10] - 2020-3-2
### Added
- Debug only

## [0.5.9] - 2020-3-2
### Added
- include boilerplate.tar.gz to release artefact
- new CI workflow

## [0.5.8] - 2020-2-28
### Added
- This is the first clean release, deployable to GCP Cloud Registry

## [0.5.7] - 2020-2-28
### Changed
- Debug

## [0.5.6] - 2020-2-28
### Changed
- Debug

## [0.5.5] - 2020-2-28
### Changed
- Debug

## [0.5.4] - 2020-2-28
### Changed
- Debug

## [0.5.3] - 2020-2-28
### Changed
- Debug

## [0.5.2] - 2020-2-28
### Changed
- Debug

## [0.5.1] - 2020-2-28
### Added
- Add build-image action

### Changed
- Migrate from tslint to eslint
 
## [0.5.0] - 2020-2-27 
### Added
- First changelog
- Use of Github Action and Github Release API

