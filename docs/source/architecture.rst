Architecture
============

.. sidebar:: Our Guiding Principle

     - Simplicity and Clean
     - Developer friendly
     - Cloud-native

Table of Contents
-----------------

  1. `Building blocks`_
  2. `Administrative service`_
  3. `Data-graph service for on-chain data`_
  4. `Data-graph service for private data`_
  5. `Remote-data service`_
  6. `Federated gateway`_
  7. `Query handler service`_

Building blocks
---------------

Below diagram depicts the architecture blocks of conceptual application per organization.

**To Do**: Replace this ugly diagram later.

.. code::

          +--------------------------+       +-----------------+
          |    Client Applicaiton    | ..... | OAuth2 Provider |
          +--------------------------+       +-----------------+
                         |                            :
    ................................................................................
                         |                            :
               +-------------------+                  :
               | Federated Gateway | <............................>
               +-------------------+                              :
                          |                                       :
          +-----------------------------------+                   :
          |               |                   |                   :
    +-----------+ +-----------------+ +----------------+ +-------------------+
    | Admin svs | | Remote-data svs | | Data-graph svs | | Query handler svs |
    +-----------+ +-----------------+ +----------------+ +-------------------+
                                              |                   |
                                              +-------------------+
                                              |                   |
                                     +------------------+     +------------+
                                     | Hyperledger Peer |     | Redisearch |
                                     +------------------+     +------------+


Administrative service
----------------------

It provides common administrative API, for example, `createWallet`, `getWallet`, or `listWallet`. Gateway developer
are not required to build it.

Data-graph service for on-chain data
------------------------------------

Data-graph service exposes the GraphQL endpoint, for each Aggregate. Below is dependency graph of *Data graph service*.
One data-graph service serves one *entity* model.

.. code:: text

    Dependency Graph
    -- data-graph service for on-chain data
        ⎿ Input-argument < FileWallet, connectionProfile,  Redis connection, auth-server >
        ⎿ typeDefs
        ⎿ Resolvers
           ⎿ Command handler
              ⎿ Repository (same as below)
           ⎿ Repository
              ⎿ Input-argument < event, model, reducer >
              ⎿ Query Database (internal)
                  ⎿ RedisRepository (internal)
                      ⎿ Input-argument < IndexDefinition, inRedisModel, outputModel, Selectors >

Notice that *QueryDatabase* and *RedisRepository* are internal component; gateway
developer does not use them directly.

Gateway developer shall define **domain model**, prior to Federated Gateway construction.
*typeDefs*, *resolvers*, *events*, *models*, *reducer*, *indexDefinition*

Data-graph service for private data
-----------------------------------

We do not use CQRS pattern to maniplate Hyperledger Fabric private data; therefore,
*RedisRepository* and *Query Database* are not required.

.. code:: text

    Dependency Graph
    -- data-graph service for private data
        ⎿ Input-argument < FileWallet, connectionProfile, auth-server >
        ⎿ typeDefs
        ⎿ Resolvers
           ⎿ Command handler
              ⎿ PrivateRepository (same as below)
           ⎿ PrivateRepository
              ⎿ Input-argument < event, model, reducer >


Below lists the core components; Gateway developer is not required to develop internal
components.

+----------------------------+--------------------------------------------------+
| Component                  | Purpose                                          |
+============================+==================================================+
| typeDefs                   | Graphql type definition of aggregate             |
+----------------------------+--------------------------------------------------+
| Resolvers                  | Graphql resolvers                                |
+----------------------------+--------------------------------------------------+
| Command handler            | Process command from aggregate                   |
+----------------------------+--------------------------------------------------+
| Repository                 | Abstraction of Hyperledger Fabric on-chain data  |
+----------------------------+--------------------------------------------------+
| PrivateRepo                | Abstraction of Hyperledger Fabric private data   |
+----------------------------+--------------------------------------------------+
| Query database (internal)  | Abstraction of DB operations, e.g. merge commit  |
+----------------------------+--------------------------------------------------+
| RedisRepository (internal) | Abstraction of Redis operations, e.g. GET / SET  |
+----------------------------+--------------------------------------------------+


Remote-data service
-------------------

It retrieves data from Federated Gateway of another organization.

Federated gateway
-----------------

It composes data-graph from underlying service.

See `Apollo Federation <https://www.apollographql.com/docs/federation/>`__.

Query handler service
---------------------

*Query Handler* service bootstraps the Redis store, every time Federated Gateway starts. The
bootstrapping reconciles data from Hyperledger Fabric on-chain data, to Redis store.

Whenever there is new commit to ledger. the contract listener will populaate the newly
arrived commit to Redis store. All commits, and computed entity will be indexed, accordingin
to *index definition*.

There is a single Query handler service per organization. It will populate changes for ALL
entity types.

.. code:: text

    Dependency Graph
    -- Query handler service
        ⎿ Input-argument < FileWallet, connectionProfile,  Redis connection, auth-server >
        ⎿ typeDefs
        ⎿ Resolvers
           ⎿ Query handler
             ⎿ Input-argument < event, model, reducer >
             ⎿ Query Database (internal)
                  ⎿ RedisRepository (internal)
                      ⎿ Input-argument < IndexDefinition, inRedisModel, outputModel, Selectors >

Notice that query handler service is not federated via Federated Gatway.
