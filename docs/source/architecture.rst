Architecture
============

Table of Contents
-----------------

There are three types of federated service.
  1. Administrative microservice
  2. `Data-graph service for on-chain data`_
  3. Data-graph service for private data
  4. Remote data microservice

Administrative microservice
~~~~~~~~~~~~~~~~~~~~~~~~~~~

It provides common administrative API, for example, `createWallet`, `getWallet`, or `listWallet`.

Data-graph service for on-chain data
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Data-graph service exposes the GraphQL endpoint, for each Aggregate. Below is dependency graph of *Data graph microservice*.

.. code:: text

    -- data graph service
        ⎿ Input-argument < FileWallet, connectionProfile,  Redis connection, auth-server >
        ⎿ typeDefs
        ⎿ Resolvers
           ⎿ Command handler
              ⎿ Repository (same as below)
           ⎿ Repository
              ⎿ Input-argument < event, model, reducer >
              ⎿ Query Database (internal)
                  ⎿ RedisRepository (internal)
                      ⎿ Input-argument < inRedisModel, outputModel, PreSelector, PostSelector >

+------------------+-----------------------------------------------------+
| Component        | Purpose                                             |
+==================+=====================================================+
| typeDefs         | Graphql type definition of aggregate                |
+------------------+-----------------------------------------------------+
| Resolvers        | Graphql resolvers                                   |
+------------------+-----------------------------------------------------+
| Command handler  | Process command from aggregate                      |
+------------------+-----------------------------------------------------+
| Repository       | Abstraction of data store, e.g. on-chain ledger     |
+------------------+-----------------------------------------------------+
| Query database   | Abstraction of DB operations, e.g. merge commit     |
+------------------+-----------------------------------------------------+
| RedisRepository  | Abstraction of Redis operations, e.g. GET / SET     |
+------------------+-----------------------------------------------------+

Notice that *QueryDatabase* and *RedisRepository* are internal component; gateway
developer does not use them directly.

Gateway developer shall define **domain model**, prior to Federated Gateway construction.
*typeDefs*, *resolvers*, *events*, *models*, *reducer*, *indexDefinition*

**typeDefs**

See Apollo documentation

**resolvers**

See
