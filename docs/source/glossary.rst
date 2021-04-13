Glossary
---------

.. glossary::
    Apollo Graphql
      **typeDefs**: also known as graphql schema, see `Apollo documentation <https://www.apollographql.com/docs/tutorial/schema/>`__

      **resolvers**: also known as graphql resolver, see `Apollo documentation <https://www.apollographql.com/docs/tutorial/resolvers/>`__

    Client Application Developer
      He develops the client application to consume the data services from Federated API Gateway.

    Command Handler
      A command handler receives command from the aggregate.

    Commit
      Commit is data representation for each writing transaction to Hyperledger Fabric. One commit may carry one, or
      an array of (business) events.

    Domain Model
      This is a broader definition than the conventional meaning of DDD. Domain models in `fabric-es`
      includes (1) conventional DDD domain model, (2) Redis models and indexing definition, and Apollo
      endpoint definition. For example, *typeDefs*, *resolvers*, *events*, *models*, *reducer*, *indexDefinition*.

    Entity
      In our current design, each federated service represents one aggregate; and in turn representing one entity;
      are 1:1:1 mapping. Both *aggregate* and *entity* refers the same meaning as entity model. For simplicity,
      *entity* are *aggregate* are interchangeable in our context.

    Federated Gateway
      also known as, *Apollo Federated API Gateway*; giving API endpoint to compose data graphs from underlying
      micro-service. Also, it may give `/healthz`, which performs health check monitoring, for underlying service.
      This gateway does NOT replace API gateway of client application. The client application is free to choose
      any type of API gateway technology.

    Federated Service
      There are threee types, (1) administrative service, (2) data-graph service, and (3) remote-data service.

      *Data-graph service* exposes Apollo federated service. The Gateway developer models the data graph for
      for one `DDD Aggregate <https://martinfowler.com/bliki/DDD_Aggregate.html#:~:text=A%20DDD%20aggregate%20is%20a,items)%20as%20a%20single%20aggregate.>`__,
      or equivalently *Entity*.

    Gateway Developer
      He develops the federated API gateway and underlying federated microservice.

    Identity Wallet
      Servers-side digital wallet, carrying list of X.509 ecert. This is generated during
      Fabric-CA user enrollment process. It is now using Fabric's file wallet, residing
      under the Federated API Gateway. All transaction written to Fabric network requires
      corresponding X.509 ecert obtained from this wallet.

    Model-free Chaincode
      Chaincode implementation which does not carry any domain model / data model inforrmation.
      That means, changes in model does not require code refactoring in chaincode.

    Network Operator
      He runs (1) Org0 - orderers; (2) Org1 - administratrive peer-node. Optionally, as a
      value-added service, he may also run peer-nodes from other organizations.

    Private Repository
      Abstraction of Hyperledger Fabric private data

    Query Database
      Abstraction of DB operations, e.g. merge commit, merge entity

    Query Handler
      Query handler processes query request, returning *output model* of entity.

    RedisRepository
      Abstraction of Redis operations, e.g. GET, SET, HGETALL, FT.SEARCH, etc.

    Redisearch - modelling
      **Index Definition** defines indexing fields, and indexing parameters per entity.

      **InRedis Model**: model representation in the Redisearch.
      Currently, hash table is the only supported format.

      **Input Model**: model representation, before processing of *pre-Selector*.

      **Output Model**: model representation, after processing of *post-Selector*.

      **Pre-Selector**: Selector function transforms *input model* to *inRedis model*.

      **Post-Selector**: Selector function transforms *inRedis model* to *output model*.

    Repository
      Abstraction of Hyperledger Fabric on-chain data per entity

    Repository Pattern
      Repository provides abstraction of data, so that applcation can work with simple abstraction.
      See `Repository Pattern <https://deviq.com/design-patterns/repository-pattern>`__.

