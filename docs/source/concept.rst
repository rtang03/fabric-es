Introduction
============

`fabric-es` is a SDK for making Hyperledger Fabric - event driven

It provides highlighted features such as:

  * Domain-driven design (DDD) / clean architecture
  * Event-sourced chaincode
  * API Federation
  * Full Text search per organization
  * Private-data protection

For developers interested in contributing us, see the
`fabric-es <https://github.com/rtang03/fabric-es>`__ repository for more information.

.. _Back to Top:

Table of Contents
-----------------

1. `Motivation`_
    1. `Too much governance`_
    2. `Time to market`_
    3. `Enterprise blockchain redesign`_
    4. `Easing production deployment`_

2. `Key concept`_
    1. `Domain driven design`_
    2. `Event-sourced chaincode`_
    3. `Federated API gateway`_
    4. `Command query responsibility segregation`_
    5. `Identity wallet`_
    6. `Identity at federated gateway`_

3. `Big picture`_
    1. `User onboarding`_
    2. `Authorization`_
    3. `Other storage type`_
    4. `Client application`_
    5. `Deployment network`_

4. `Assumption & limitation`_

5. `Changelog`_

Motivation
----------

*fabric-es* is made to solve difficult problems, via utility, principles & patterns. It reduces the time and efforts of
application development in **enterprise blockchain**.

Too much governance
~~~~~~~~~~~~~~~~~~~~~~

In the typical consortium, the organizations are usually co-competitor relationships. The consortium may run central governance;
it imposes stricter data and api requirement. It is more likely a form of coordinated / federated application. Typically,
it may agree an consortium-wide data standard, and api specification; resulting a super-sized and centralized API Gateway.
Organizations are hard to differentiate; and reluctant to contribute. Also, consortium-wide decision is costly and more time
to make.

Conflict resolution via voting will result in suboptimal solution. And, consortium-wide conflict resolution shoule be kept minmal.
Organizations are hoping to develop applications in an automony way; or technically speaking, demands more decentralization
and decoupling.

Time to market
~~~~~~~~~~~~~~

Most designers use the conventional database modeling and n-tier achitecture. When there is changes in data requiremnt, it
requires changes and development it different components. Provided centralized governance, the changes may require to follow
tedious change control procedures. A simple change in data models invokes a chain reactions across organizations. The
development and testing effort are also high.

Second, production deployment in enterprise blockchain is hard. In Hyperledger Fabric, this is a tremendous efforts to
maintain multiple channels, mulitple chaincode, and their ongoing maintenance.

Enterprise blockchain redesign
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Unlike public chain (e.g. Ethereum); enterprise blockchain application does not bother with "scalability issue". As a
low hanging fruit, many designers attempt to persist all data to blockchain, even though it does not require immutability.
There are no simple way to manipulate data with a mixed / multiple blockchains, and non-blockchain data.

This library builds federated API gateway, similar as **L2 side-chain**, or **side-tree equivalence** in enterprise blockchain application.

Easing production deployment
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Unlike public chain, enterprise blockchain has lots of challenges in production deployment. One challenge comes from frequent
change in chaincode, version management, and redeployment. With clean architecture, we build model-free chaincode. It
significantly reduce above burden. We aim to support multiple use cases, in one chain, just like public chain does.

For the comprehesive measure to ease production deployment, is out-of-scope.

`Back to Top`_

Key concept
-----------

We have made a number of architecture decisions.

Domain driven design
~~~~~~~~~~~~~~~~~~~~

Each organization is obviously a bounded context. The use of clean archiecture replaces n-tier architecture. During
application development, the decouple of inner and outer elements, allows automous development, (1) amongst organization;
and (2) between orgnization and network operator.

+----------------------+-----------------------------------------------------------------------+
| Role                 | Responsible for                                                       |
+======================+=======================================================================+
| Network operator     | Chaincode development                                                 |
+----------------------+-----------------------------------------------------------------------+
| Gateway developer    | Domain modeling; API modeling; Search modeling; federated gateway     |
+----------------------+-----------------------------------------------------------------------+
| Client app developer | Client application consuming the federated gateway                    |
+----------------------+-----------------------------------------------------------------------+

The gateway developer and client app developer are not required to possess Hyperledger Fabric knowledge.

Event-sourced chaincode
~~~~~~~~~~~~~~~~~~~~~~~

The blockchain is `event-sourced <https://docs.microsoft.com/en-us/azure/architecture/patterns/event-sourcing>`__, by
its own nature. We develop a special chaincode, see `fabric-es-chaincode <https://github.com/rtang03/fabric-es-chaincode>`__
repository. Each transaction invocation is to persist the event-sourced payload. There are 2 chaincodes, (1) for shared
event store; and (2) for private data (of implicit collection).

Both gateway developer and client app developer are no longer required to develop chaincode. And, we use Hyperledger
external chaincode launcher, so that it re-usable for any use cases, i.e. model-free chaincode, and minimal maintenance
effort. This is big benefit to time-to-market.

Federated API gateway
~~~~~~~~~~~~~~~~~~~~~

We use `Apollo Federation <https://www.apollographql.com/docs/federation/>`__. The declarative / federated API gateway
implements interface for writing command, and querying state, composing API call from underlying federated service.
The initial implementation includes (a) Hyperledger Fabric on-chain ledger, and (b) private-data ledger; each are
exposed via federated service.

The strongly typed API is directly derived from DDD domain model. Details will be elaborated via *counter expample*. This
enables `end-to-end type-safety <https://charlesagile.com/end-to-end-type-safety>`__.

This is a kind of side-tree design. Each organization will deploy a federated API gateway.
The underlying implementation is transparent to upstream client application. And, federated
API gateways can fetch data across organizations, via `ambassador <https://docs.microsoft.com/en-us/azure/architecture/patterns/ambassador>`__
microservice, or namely *remote-data* service.

The federated gateway capability is under `packages/gateway-lib`.

Additional federated service may be added to the federated API gateway, as future extension. For example, we plan
to implement microservice to consume IPFS storage, and plain file system.

Command query responsibility segregation
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Each federated service is built with `CQRS <https://docs.microsoft.com/en-us/azure/architecture/patterns/cqrs>`__.
For the sake of `reactive design pattern <https://www.reactivedesignpatterns.com/>`__, the internal of of each federated
microservice is built with `redux-observable <https://redux-observable.js.org/>`__ middleware.

We use `RediSearch <https://oss.redislabs.com/redisearch/>`__, the full text search engine from *RedisLab*. Again,
the full text search is modelled in a clean-architecture way; so that each organization does search modelling, declaratively,
and in an autonomy way. It becomes the core engine for query-side capability of CQRS. In current implementation, only
on-chain public ledger is sent to Redisearch.

The CQRS capability is under `package/fabric-cqrs`. This software library hides all complexity with CQRS and reactivity.
Unless you are developer of `fabric-es`; you are not required to implement it.

Identity Wallet
~~~~~~~~~~~~~~~
There are two approaches for server-side identity wallet, of Hyperledger Fabric.

**1. Individual Wallet**

The bootstraping step registers and enrolls X.509 ecert for orgnanizational administrator. Later on, the new user registers
and enrolls himself before he can write transaction with his own X.509 ecert. This approach is insufficient in privacy
protection, while some use cases may require to de-link the transaction from identity.

**2. Organizational Wallet**

Only orgnanizational administrator registers and enrolls identity, with which all transactions are commited. It shall
require additional identity system, e.g. Decentralizerd Identity.

Both approaches are have pros and cons. Tentatively, we support both approaches. For sake of better privacy; the design
decision may change later, towards organizational wallet.

Identity at federated gateway
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Federated gateway relies on external OAuth2 provider, for user authentication. The client application passes the bearer
token, to federated gateway; it will in turn ask for authorization from OAuth2 provider; returning `user_id` and `username`.
They will be transitively passed to graphql resolvers via Apollo context.

For demonstration purpose, we develop a home-grown OAuth2 provider, in `auth-server <https://github.com/rtang03/auth-server>`__
repository. Its pre-requisite includes Postgresql and Redis. Please feel free to choose OAuth2 provider at your own preferrence.
This auth-server is for testing purpose; not suitable for production deployment.

Alternatively, we develop a secondary implementation of Federated Gateway using cloud-based OAuth2 / OIDC service
`Auth0.com <https://auth0.com>`__.

.. hint:: If you don't have pre-existing OAuth2 provider / identity provider, I strongly
    recommend using cloud-based provider, rather than building it yourself.

`Back to Top`_

Big picture
-----------

Still, there are other essential components to consider.

User onboarding
~~~~~~~~~~~~~~~

User onboarding should belong to Client application's core features. With higher degree of autonomy, each organization
may develop his own way of user onboarding to the permissioned network. And naturally, they shall choose his own OAuth2
or identity provider. Federated Gateway is the downstream service of the Client application. Therefore, it shall follow
accordingly. In some situtation, a unified / consortium-wide user-onboarding process may be suitable.

The home-grown *auth-server* offers a starter code, for user registration, if you plan to build from scratch.

As an experimental development, we are attempting `W3C Decentralized Identity <https://www.w3.org/TR/did-core/>`__; under
`package/model-identity`.

Authorization
~~~~~~~~~~~~~

Each organization shall have finer access control on actions and events; and is use-case dependent. The authorization can
be implemented in either client application, or Federated Gateway; at which the design decision is not yet made.

`Open Policy Agent <https://www.openpolicyagent.org/docs/latest/>`__ is a good candidate; which we may later implement
within Federated Gateway. The gateway developer can model the policy data, with common language.

Other storage type
~~~~~~~~~~~~~~~~~~

Additional storage types are being considered. They will be similarly exposed via data graph microservice.
  - IPFS
  - Object storage
  - Plain file system

Client application
~~~~~~~~~~~~~~~~~~

The client application is upstream application of Federated Gateway; is out of scope. However, for the sake of reduced
effort, you are encouraged to use similar stack as `fabric-es`. (1) Provided that client application and Federated Gateway
reside in the same monorepo, and using Apollo stack, you can gain the benefit of end-to-end type-safety.

Deployment network
~~~~~~~~~~~~~~~~~~~~~

Under construction.

Assumption & Limitation
-----------------------

  1. There is no full-text search in private data collection. No plan to support it.
  2. The current design assumes one public channel.
  3. The current design assumes one peer per organization.
  4. *dev-net* is not suitable for production deployment.

Changelog
---------

We do not reached stable API. The `Changelog <https://github.com/rtang03/fabric-es/blob/master/CHANGELOG.md>`__
provide more details for users to understand releases.

`Back to Top`_
