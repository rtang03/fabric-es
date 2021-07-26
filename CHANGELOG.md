# Changelog

## [Unreleased](https://github.com/rtang03/fabric-es/tree/HEAD)

[Full Changelog](https://github.com/rtang03/fabric-es/compare/v0.7.12...HEAD)

**Implemented enhancements:**

- Logger timestamp support timezone setting [\#200](https://github.com/rtang03/fabric-es/issues/200)
- detach the "reconcile" from gw-org bootstrapping step [\#173](https://github.com/rtang03/fabric-es/issues/173)

**Fixed bugs:**

- RedisSearch full text "DESC" order fails to perform [\#215](https://github.com/rtang03/fabric-es/issues/215)

**Closed issues:**

- chore: Add changelog to Release notes [\#211](https://github.com/rtang03/fabric-es/issues/211)

**Merged pull requests:**

- fix: issue215 - incorrect sorting [\#216](https://github.com/rtang03/fabric-es/pull/216) ([rtang03](https://github.com/rtang03))
- feat: added timeszone support in logger [\#214](https://github.com/rtang03/fabric-es/pull/214) ([hkicl-ming](https://github.com/hkicl-ming))

## [v0.7.12](https://github.com/rtang03/fabric-es/tree/v0.7.12) (2021-04-21)

[Full Changelog](https://github.com/rtang03/fabric-es/compare/v0.7.11...v0.7.12)

## [v0.7.11](https://github.com/rtang03/fabric-es/tree/v0.7.11) (2021-04-21)

[Full Changelog](https://github.com/rtang03/fabric-es/compare/v0.7.10...v0.7.11)

## [v0.7.10](https://github.com/rtang03/fabric-es/tree/v0.7.10) (2021-04-21)

[Full Changelog](https://github.com/rtang03/fabric-es/compare/v0.7.9...v0.7.10)

**Closed issues:**

- fix: Private data created before it's public counterpart [\#212](https://github.com/rtang03/fabric-es/issues/212)

**Merged pull requests:**

- fix: Private data created before it's public counterpart [\#213](https://github.com/rtang03/fabric-es/pull/213) ([pangduckwai](https://github.com/pangduckwai))

## [v0.7.9](https://github.com/rtang03/fabric-es/tree/v0.7.9) (2021-04-15)

[Full Changelog](https://github.com/rtang03/fabric-es/compare/v0.7.8...v0.7.9)

**Implemented enhancements:**

- add alternative implementation of auth0 [\#202](https://github.com/rtang03/fabric-es/issues/202)
- Did data registry [\#197](https://github.com/rtang03/fabric-es/issues/197)

**Closed issues:**

- add ReadTheDocs [\#206](https://github.com/rtang03/fabric-es/issues/206)
- update README [\#198](https://github.com/rtang03/fabric-es/issues/198)

**Merged pull requests:**

- docs: add loan example [\#210](https://github.com/rtang03/fabric-es/pull/210) ([rtang03](https://github.com/rtang03))
- feat: Data Catalog [\#209](https://github.com/rtang03/fabric-es/pull/209) ([pangduckwai](https://github.com/pangduckwai))
- docs: add readthedocs [\#207](https://github.com/rtang03/fabric-es/pull/207) ([rtang03](https://github.com/rtang03))
- docs: fix README [\#205](https://github.com/rtang03/fabric-es/pull/205) ([rtang03](https://github.com/rtang03))
- feat: create / resolve DidDocument [\#204](https://github.com/rtang03/fabric-es/pull/204) ([rtang03](https://github.com/rtang03))
- feat: enable auth0 in gateway-lib [\#203](https://github.com/rtang03/fabric-es/pull/203) ([rtang03](https://github.com/rtang03))

## [v0.7.8](https://github.com/rtang03/fabric-es/tree/v0.7.8) (2021-03-26)

[Full Changelog](https://github.com/rtang03/fabric-es/compare/v0.7.7...v0.7.8)

## [v0.7.7](https://github.com/rtang03/fabric-es/tree/v0.7.7) (2021-03-26)

[Full Changelog](https://github.com/rtang03/fabric-es/compare/v0.7.6...v0.7.7)

**Merged pull requests:**

- feat: Domain Model Refactoring for Query Handler Search [\#201](https://github.com/rtang03/fabric-es/pull/201) ([pangduckwai](https://github.com/pangduckwai))
- feat: model-identity - Did Document [\#199](https://github.com/rtang03/fabric-es/pull/199) ([rtang03](https://github.com/rtang03))

## [v0.7.6](https://github.com/rtang03/fabric-es/tree/v0.7.6) (2021-03-11)

[Full Changelog](https://github.com/rtang03/fabric-es/compare/v0.7.5...v0.7.6)

**Closed issues:**

- upgrade to Redisearch v2, and deprecate Find function [\#184](https://github.com/rtang03/fabric-es/issues/184)

**Merged pull requests:**

- feat: dev-net enhancement [\#196](https://github.com/rtang03/fabric-es/pull/196) ([hkicl-ming](https://github.com/hkicl-ming))
- feat: dev-net enhancement [\#194](https://github.com/rtang03/fabric-es/pull/194) ([hkicl-ming](https://github.com/hkicl-ming))
- fix: Fix RedisPubSub related issue when running gateway as docker images [\#193](https://github.com/rtang03/fabric-es/pull/193) ([pangduckwai](https://github.com/pangduckwai))
- feat: Remote Data on the New Query Handler [\#192](https://github.com/rtang03/fabric-es/pull/192) ([pangduckwai](https://github.com/pangduckwai))
- docs: add comment / readme [\#191](https://github.com/rtang03/fabric-es/pull/191) ([rtang03](https://github.com/rtang03))
- feat: new search capability [\#190](https://github.com/rtang03/fabric-es/pull/190) ([rtang03](https://github.com/rtang03))
- chore: Add workaround to avoid redis error when shutdown query-handler service [\#189](https://github.com/rtang03/fabric-es/pull/189) ([pangduckwai](https://github.com/pangduckwai))
- refactor: deduplicate BaseEntity class and interface [\#188](https://github.com/rtang03/fabric-es/pull/188) ([rtang03](https://github.com/rtang03))

## [v0.7.5](https://github.com/rtang03/fabric-es/tree/v0.7.5) (2021-01-25)

[Full Changelog](https://github.com/rtang03/fabric-es/compare/v0.7.4...v0.7.5)

**Fixed bugs:**

- fail to run dev-net/dn-test.gw-2.sh, because of timeout [\#182](https://github.com/rtang03/fabric-es/issues/182)

**Closed issues:**

- upgrade eslint to work with ts 4.1.x [\#186](https://github.com/rtang03/fabric-es/issues/186)
- upgrade to latest typescript [\#183](https://github.com/rtang03/fabric-es/issues/183)
- publish libraries to npmjs.com [\#172](https://github.com/rtang03/fabric-es/issues/172)

**Merged pull requests:**

- chore: upgrade eslint [\#187](https://github.com/rtang03/fabric-es/pull/187) ([rtang03](https://github.com/rtang03))
- chore: update typescript v4.1.3 [\#185](https://github.com/rtang03/fabric-es/pull/185) ([rtang03](https://github.com/rtang03))

## [v0.7.4](https://github.com/rtang03/fabric-es/tree/v0.7.4) (2021-01-23)

[Full Changelog](https://github.com/rtang03/fabric-es/compare/v0.7.3...v0.7.4)

## [v0.7.3](https://github.com/rtang03/fabric-es/tree/v0.7.3) (2021-01-23)

[Full Changelog](https://github.com/rtang03/fabric-es/compare/v0.7.2...v0.7.3)

## [v0.7.2](https://github.com/rtang03/fabric-es/tree/v0.7.2) (2021-01-23)

[Full Changelog](https://github.com/rtang03/fabric-es/compare/v0.7.1...v0.7.2)

**Implemented enhancements:**

- refactor: in ui-control, replace queryHandler apollolink with gw-org apollolink [\#174](https://github.com/rtang03/fabric-es/issues/174)
- migrate to external chaincode launcher - refactor dev-net [\#171](https://github.com/rtang03/fabric-es/issues/171)
- migrate to external chaincode launcher - new chaincode repo [\#170](https://github.com/rtang03/fabric-es/issues/170)

**Closed issues:**

- detach auth-server to separate repo [\#176](https://github.com/rtang03/fabric-es/issues/176)
- doc: Typedoc [\#152](https://github.com/rtang03/fabric-es/issues/152)

**Merged pull requests:**

- fix: .nojerkll  [\#181](https://github.com/rtang03/fabric-es/pull/181) ([rtang03](https://github.com/rtang03))
- docs: add typedoc [\#180](https://github.com/rtang03/fabric-es/pull/180) ([rtang03](https://github.com/rtang03))
- chore: Prepare tester and dev-net to port to cdi-samples [\#179](https://github.com/rtang03/fabric-es/pull/179) ([pangduckwai](https://github.com/pangduckwai))
- feat: reference Implementation robustness test [\#178](https://github.com/rtang03/fabric-es/pull/178) ([pangduckwai](https://github.com/pangduckwai))
- refactor: remove auth-server [\#177](https://github.com/rtang03/fabric-es/pull/177) ([rtang03](https://github.com/rtang03))
- refactor: change to external cc launcher [\#175](https://github.com/rtang03/fabric-es/pull/175) ([rtang03](https://github.com/rtang03))

## [v0.7.1](https://github.com/rtang03/fabric-es/tree/v0.7.1) (2020-12-19)

[Full Changelog](https://github.com/rtang03/fabric-es/compare/v0.7.0...v0.7.1)

**Implemented enhancements:**

- add /healthcheck probe to ui-control [\#166](https://github.com/rtang03/fabric-es/issues/166)
- reduce ui-control image size [\#164](https://github.com/rtang03/fabric-es/issues/164)
- create release artifact "dev-net" [\#162](https://github.com/rtang03/fabric-es/issues/162)
- create "ui-control" image in create-release workflow [\#161](https://github.com/rtang03/fabric-es/issues/161)
- enhanced logger.debug [\#158](https://github.com/rtang03/fabric-es/issues/158)
- add /healthcheck probe to gateway-lib [\#156](https://github.com/rtang03/fabric-es/issues/156)
- add /healthcheck probe to auth-server [\#147](https://github.com/rtang03/fabric-es/issues/147)
- GitHub action enhancements [\#140](https://github.com/rtang03/fabric-es/issues/140)
- add step to create image during releasing [\#132](https://github.com/rtang03/fabric-es/issues/132)

**Fixed bugs:**

- "tester" docker does not run test properly [\#153](https://github.com/rtang03/fabric-es/issues/153)
- fail to run "tsc" during CI [\#150](https://github.com/rtang03/fabric-es/issues/150)
- missing psql schema in auth-server [\#148](https://github.com/rtang03/fabric-es/issues/148)
- during CI, the auth-server fail because of not connecting psql [\#143](https://github.com/rtang03/fabric-es/issues/143)

**Closed issues:**

- \(postponed\) upgrade RediSearch from v1.8.3 to v2.0 [\#160](https://github.com/rtang03/fabric-es/issues/160)
- replace fabric-client v1.4.x [\#151](https://github.com/rtang03/fabric-es/issues/151)
- CI fails because of Nodejs version change in GH Action's ubuntu image [\#142](https://github.com/rtang03/fabric-es/issues/142)
- Revamp reducer related types [\#131](https://github.com/rtang03/fabric-es/issues/131)
- Revamp usage of log-level functions in code [\#130](https://github.com/rtang03/fabric-es/issues/130)
- update README.md and OPERATIONS.md [\#40](https://github.com/rtang03/fabric-es/issues/40)

**Merged pull requests:**

- fix: missing http:// in authCheck uri [\#169](https://github.com/rtang03/fabric-es/pull/169) ([rtang03](https://github.com/rtang03))
- fix: ui-control images with correct dependency [\#168](https://github.com/rtang03/fabric-es/pull/168) ([rtang03](https://github.com/rtang03))
- feat: add /healthcheck probe to ui-control [\#167](https://github.com/rtang03/fabric-es/pull/167) ([rtang03](https://github.com/rtang03))
- chore: reduce image size [\#165](https://github.com/rtang03/fabric-es/pull/165) ([rtang03](https://github.com/rtang03))
- feat: add ui-control to create-release [\#163](https://github.com/rtang03/fabric-es/pull/163) ([rtang03](https://github.com/rtang03))
- refactor: add debug message to enrolAdmin [\#159](https://github.com/rtang03/fabric-es/pull/159) ([rtang03](https://github.com/rtang03))
- feat: add /healthcheck to gw-orgX [\#157](https://github.com/rtang03/fabric-es/pull/157) ([rtang03](https://github.com/rtang03))
- chore: restrict changelog to master [\#155](https://github.com/rtang03/fabric-es/pull/155) ([rtang03](https://github.com/rtang03))
- fix: run 2org integration test during create-release [\#154](https://github.com/rtang03/fabric-es/pull/154) ([rtang03](https://github.com/rtang03))
- feat: multiple important updates and bug fixes [\#149](https://github.com/rtang03/fabric-es/pull/149) ([rtang03](https://github.com/rtang03))
- test: attempt a clean run after using auto changelog [\#146](https://github.com/rtang03/fabric-es/pull/146) ([rtang03](https://github.com/rtang03))
- chore: debug changelog.yaml [\#145](https://github.com/rtang03/fabric-es/pull/145) ([rtang03](https://github.com/rtang03))
- chore: attempt changelog.yaml [\#144](https://github.com/rtang03/fabric-es/pull/144) ([rtang03](https://github.com/rtang03))
- feat: enhance GitHub Actions [\#141](https://github.com/rtang03/fabric-es/pull/141) ([rtang03](https://github.com/rtang03))
- refactor: handle multipart form fields with content types [\#139](https://github.com/rtang03/fabric-es/pull/139) ([pangduckwai](https://github.com/pangduckwai))
- fix: add work around to accept JSON data provided in query params [\#137](https://github.com/rtang03/fabric-es/pull/137) ([pangduckwai](https://github.com/pangduckwai))

## [v0.7.0](https://github.com/rtang03/fabric-es/tree/v0.7.0) (2020-10-09)

[Full Changelog](https://github.com/rtang03/fabric-es/compare/v0.6.6...v0.7.0)

## [v0.6.6](https://github.com/rtang03/fabric-es/tree/v0.6.6) (2020-10-09)

[Full Changelog](https://github.com/rtang03/fabric-es/compare/v0.6.5...v0.6.6)

**Implemented enhancements:**

- expand the CD to Org2 [\#129](https://github.com/rtang03/fabric-es/issues/129)
- external chaincode launcher [\#126](https://github.com/rtang03/fabric-es/issues/126)
- operator grpc server [\#119](https://github.com/rtang03/fabric-es/issues/119)
- add Prometheus [\#116](https://github.com/rtang03/fabric-es/issues/116)
- pick the better / readable log format [\#99](https://github.com/rtang03/fabric-es/issues/99)
- build k8s based dev-net [\#97](https://github.com/rtang03/fabric-es/issues/97)
- upload micro-service [\#47](https://github.com/rtang03/fabric-es/issues/47)
- Boilerplate-d continuous delivery [\#15](https://github.com/rtang03/fabric-es/issues/15)
- partially work with ingress controller [\#124](https://github.com/rtang03/fabric-es/pull/124) ([rtang03](https://github.com/rtang03))
- add new org - interim change [\#122](https://github.com/rtang03/fabric-es/pull/122) ([rtang03](https://github.com/rtang03))

**Merged pull requests:**

- Fix issue with logging to files [\#136](https://github.com/rtang03/fabric-es/pull/136) ([pangduckwai](https://github.com/pangduckwai))
- Tester enhancements [\#135](https://github.com/rtang03/fabric-es/pull/135) ([pangduckwai](https://github.com/pangduckwai))
- Improve key fields tagging for pboc/etc, improve logging [\#134](https://github.com/rtang03/fabric-es/pull/134) ([pangduckwai](https://github.com/pangduckwai))
- Improve error message when trying to process non-existing entities \(i… [\#133](https://github.com/rtang03/fabric-es/pull/133) ([pangduckwai](https://github.com/pangduckwai))
- Add missing fix to relay test [\#128](https://github.com/rtang03/fabric-es/pull/128) ([pangduckwai](https://github.com/pangduckwai))
- Update domain model of pbc/etc connectivity [\#127](https://github.com/rtang03/fabric-es/pull/127) ([pangduckwai](https://github.com/pangduckwai))
- Domain model updates [\#125](https://github.com/rtang03/fabric-es/pull/125) ([pangduckwai](https://github.com/pangduckwai))
- update image build version to 0.6.5 [\#121](https://github.com/rtang03/fabric-es/pull/121) ([hohowin](https://github.com/hohowin))

## [v0.6.5](https://github.com/rtang03/fabric-es/tree/v0.6.5) (2020-09-04)

[Full Changelog](https://github.com/rtang03/fabric-es/compare/v0.6.4...v0.6.5)

**Implemented enhancements:**

- redeploy helm chart to GCP [\#105](https://github.com/rtang03/fabric-es/issues/105)
- evaluate ansible and choice of dns [\#104](https://github.com/rtang03/fabric-es/issues/104)
- gcp networking [\#115](https://github.com/rtang03/fabric-es/pull/115) ([rtang03](https://github.com/rtang03))
- deploy 5 orderers 1 peer to GCP [\#114](https://github.com/rtang03/fabric-es/pull/114) ([rtang03](https://github.com/rtang03))

**Closed issues:**

- Define IAM users, groups, roles, and policies [\#108](https://github.com/rtang03/fabric-es/issues/108)

**Merged pull requests:**

- Fix getLogger issue which open too many files [\#123](https://github.com/rtang03/fabric-es/pull/123) ([pangduckwai](https://github.com/pangduckwai))
- Add relay services to dev-net [\#120](https://github.com/rtang03/fabric-es/pull/120) ([pangduckwai](https://github.com/pangduckwai))
- PbOC / eTC connectivity [\#118](https://github.com/rtang03/fabric-es/pull/118) ([pangduckwai](https://github.com/pangduckwai))
- Successfully released v0.6.4 [\#109](https://github.com/rtang03/fabric-es/pull/109) ([hohowin](https://github.com/hohowin))
- update version to 0.6.4 [\#107](https://github.com/rtang03/fabric-es/pull/107) ([hohowin](https://github.com/hohowin))

## [v0.6.4](https://github.com/rtang03/fabric-es/tree/v0.6.4) (2020-08-18)

[Full Changelog](https://github.com/rtang03/fabric-es/compare/v0.6.3...v0.6.4)

**Implemented enhancements:**

- merge 0.6.3 [\#103](https://github.com/rtang03/fabric-es/pull/103) ([rtang03](https://github.com/rtang03))

**Merged pull requests:**

- Sniffing [\#106](https://github.com/rtang03/fabric-es/pull/106) ([pangduckwai](https://github.com/pangduckwai))

## [v0.6.3](https://github.com/rtang03/fabric-es/tree/v0.6.3) (2020-08-04)

[Full Changelog](https://github.com/rtang03/fabric-es/compare/v0.6.2...v0.6.3)

**Implemented enhancements:**

- evaluate broader use of Prometheus [\#95](https://github.com/rtang03/fabric-es/issues/95)
- caliper performance and capacity tests [\#94](https://github.com/rtang03/fabric-es/issues/94)
- make ui-control image, and be part of dev-net [\#86](https://github.com/rtang03/fabric-es/issues/86)
- enhance the security; add refresh token [\#85](https://github.com/rtang03/fabric-es/issues/85)
- add Apollo Client subscription to ui-control [\#84](https://github.com/rtang03/fabric-es/issues/84)
- valid token check for ui-control [\#81](https://github.com/rtang03/fabric-es/issues/81)
- add Rxjs timeInterval when createCommit [\#78](https://github.com/rtang03/fabric-es/issues/78)
- consolidate ui-account to ui-control [\#77](https://github.com/rtang03/fabric-es/issues/77)
- additional api and meta data for createQueryDatabase [\#76](https://github.com/rtang03/fabric-es/issues/76)
- paginated api and pagination retrieval \(cursor based\) [\#75](https://github.com/rtang03/fabric-es/issues/75)
- Inconsistent result type from Query-side Redis result [\#74](https://github.com/rtang03/fabric-es/issues/74)
- add health-check for dev-net, during CI [\#72](https://github.com/rtang03/fabric-es/issues/72)
- refactoring gw-org\* and model\* [\#65](https://github.com/rtang03/fabric-es/issues/65)
- full text search enhancement [\#64](https://github.com/rtang03/fabric-es/issues/64)
- Change from http-middleware-proxy to Ngnix [\#63](https://github.com/rtang03/fabric-es/issues/63)
- 🔆 adopt RediSearch to power full text search and auto-complete [\#56](https://github.com/rtang03/fabric-es/issues/56)
- Refactor fabric-cqrs and Gatewaylib, to using newly added Redis and Query-Handler [\#54](https://github.com/rtang03/fabric-es/issues/54)
- event notification for queryHandler [\#53](https://github.com/rtang03/fabric-es/issues/53)
- Dashboard and reporting [\#52](https://github.com/rtang03/fabric-es/issues/52)
- enhance proxy server [\#46](https://github.com/rtang03/fabric-es/issues/46)
- finishing the current sprint by creating 0.6.2 release [\#42](https://github.com/rtang03/fabric-es/issues/42)
- Query-Handler implementation [\#20](https://github.com/rtang03/fabric-es/issues/20)
- interim changes for caliper [\#96](https://github.com/rtang03/fabric-es/pull/96) ([rtang03](https://github.com/rtang03))
- ui-control is done [\#93](https://github.com/rtang03/fabric-es/pull/93) ([rtang03](https://github.com/rtang03))
- add createWallet to ui-control [\#89](https://github.com/rtang03/fabric-es/pull/89) ([rtang03](https://github.com/rtang03))
- enhanced web security by changing to inmemory access token [\#87](https://github.com/rtang03/fabric-es/pull/87) ([rtang03](https://github.com/rtang03))
- fullTextSearch for Entity and Commit [\#83](https://github.com/rtang03/fabric-es/pull/83) ([rtang03](https://github.com/rtang03))
- ui for fulltext search [\#82](https://github.com/rtang03/fabric-es/pull/82) ([rtang03](https://github.com/rtang03))
- add paginated full text search and parametric search [\#80](https://github.com/rtang03/fabric-es/pull/80) ([rtang03](https://github.com/rtang03))
- use nginx  [\#70](https://github.com/rtang03/fabric-es/pull/70) ([rtang03](https://github.com/rtang03))
- query-handler implementation [\#67](https://github.com/rtang03/fabric-es/pull/67) ([rtang03](https://github.com/rtang03))
- query-handler is functionally ok [\#62](https://github.com/rtang03/fabric-es/pull/62) ([rtang03](https://github.com/rtang03))

**Fixed bugs:**

- when there is no enrolled wallet,... fail to return [\#92](https://github.com/rtang03/fabric-es/issues/92)
- change the server side wallet file from \[username\].id to \[user\_id\].id [\#90](https://github.com/rtang03/fabric-es/issues/90)
- findBy function cannot replace getProjection [\#68](https://github.com/rtang03/fabric-es/issues/68)
- getProjection function [\#66](https://github.com/rtang03/fabric-es/issues/66)
- fix security bugs in ui-control [\#88](https://github.com/rtang03/fabric-es/pull/88) ([rtang03](https://github.com/rtang03))
- where-clause added for find.js [\#69](https://github.com/rtang03/fabric-es/pull/69) ([rtang03](https://github.com/rtang03))
- remove auth from publishing [\#51](https://github.com/rtang03/fabric-es/pull/51) ([rtang03](https://github.com/rtang03))

**Closed issues:**

- Pick better log cloud [\#101](https://github.com/rtang03/fabric-es/issues/101)
- Define system backup strategy [\#100](https://github.com/rtang03/fabric-es/issues/100)
- Prepare the infrastructure for UAT and Prod [\#98](https://github.com/rtang03/fabric-es/issues/98)
- Add Checking in Auth Docker Image [\#71](https://github.com/rtang03/fabric-es/issues/71)
- Develop recovery mechanism for the relay [\#60](https://github.com/rtang03/fabric-es/issues/60)
- Enhance security module for the relay [\#59](https://github.com/rtang03/fabric-es/issues/59)
- Deploy Fabric 2.1 and gw-org1 / gw-org2 to AWS [\#58](https://github.com/rtang03/fabric-es/issues/58)
- Deploy relay to AWS [\#57](https://github.com/rtang03/fabric-es/issues/57)

**Merged pull requests:**

- Fix relay/sniffer issues working with redis [\#102](https://github.com/rtang03/fabric-es/pull/102) ([pangduckwai](https://github.com/pangduckwai))
- Issue57 fixes [\#91](https://github.com/rtang03/fabric-es/pull/91) ([pangduckwai](https://github.com/pangduckwai))
- Track private data [\#79](https://github.com/rtang03/fabric-es/pull/79) ([pangduckwai](https://github.com/pangduckwai))
- Issue71 [\#73](https://github.com/rtang03/fabric-es/pull/73) ([hohowin](https://github.com/hohowin))
- Issue\# 57: Deploy relay to AWS [\#61](https://github.com/rtang03/fabric-es/pull/61) ([hohowin](https://github.com/hohowin))

## [v0.6.2](https://github.com/rtang03/fabric-es/tree/v0.6.2) (2020-05-21)

[Full Changelog](https://github.com/rtang03/fabric-es/compare/v0.6.1...v0.6.2)

**Implemented enhancements:**

- add "CreateWallet" function to ui-account [\#41](https://github.com/rtang03/fabric-es/issues/41)
- Digital wallet [\#36](https://github.com/rtang03/fabric-es/issues/36)
- add reverse proxy in micro-service style [\#26](https://github.com/rtang03/fabric-es/issues/26)
- collective revamping task for authentication package [\#19](https://github.com/rtang03/fabric-es/issues/19)
- interim changes [\#49](https://github.com/rtang03/fabric-es/pull/49) ([rtang03](https://github.com/rtang03))
- add createWallet to ui and run e2e 1org scenario [\#45](https://github.com/rtang03/fabric-es/pull/45) ([rtang03](https://github.com/rtang03))
- Refactor gateway-lib to using new auth package [\#38](https://github.com/rtang03/fabric-es/pull/38) ([rtang03](https://github.com/rtang03))
- Revamp auth-server [\#34](https://github.com/rtang03/fabric-es/pull/34) ([rtang03](https://github.com/rtang03))
- Backporting docker image building scripts [\#33](https://github.com/rtang03/fabric-es/pull/33) ([pangduckwai](https://github.com/pangduckwai))
- Use release versions as dev-net docker image versions [\#32](https://github.com/rtang03/fabric-es/pull/32) ([pangduckwai](https://github.com/pangduckwai))
- Merge projectionDb search changes from 0.5.16 to master [\#30](https://github.com/rtang03/fabric-es/pull/30) ([pangduckwai](https://github.com/pangduckwai))
- V2dn3org [\#25](https://github.com/rtang03/fabric-es/pull/25) ([pangduckwai](https://github.com/pangduckwai))

**Fixed bugs:**

- TypeOrm Dependency Error [\#43](https://github.com/rtang03/fabric-es/issues/43)
- ui-account: token expiry and /home [\#35](https://github.com/rtang03/fabric-es/issues/35)
- registerAndEnroll misbehaviour in gw-node [\#2](https://github.com/rtang03/fabric-es/issues/2)
- fix bug for issue \#43 [\#44](https://github.com/rtang03/fabric-es/pull/44) ([rtang03](https://github.com/rtang03))

**Closed issues:**

- upgrade to Fabric v2.1 [\#39](https://github.com/rtang03/fabric-es/issues/39)
- split micro-services to running on standalone container [\#21](https://github.com/rtang03/fabric-es/issues/21)

**Merged pull requests:**

- update dependency and upgrade to Fabric V2.1 [\#50](https://github.com/rtang03/fabric-es/pull/50) ([rtang03](https://github.com/rtang03))
- Dev-net for new auth server [\#48](https://github.com/rtang03/fabric-es/pull/48) ([pangduckwai](https://github.com/pangduckwai))
- Add entity lifecycle event checking for writing into blockchain \(issue \#84\) [\#37](https://github.com/rtang03/fabric-es/pull/37) ([pangduckwai](https://github.com/pangduckwai))



\* *This Changelog was automatically generated by [github_changelog_generator](https://github.com/github-changelog-generator/github-changelog-generator)*
