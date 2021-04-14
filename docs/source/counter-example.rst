Tutorial
========

A *Simple COUNTER*

.. sidebar:: Pre-requisite

     - Apollo Graphql v2.x
     - ExpressJs v4.x
     - NodeJs v14.x
     - RediSearch v2.x
     - Typescript v4.x

Table of Contents
-----------------

1. `Define domain model`_
    1. `Events`_
    2. `Entity`_
    3. `Reducer`_
    4. `Repository`_

2. `Define Redisearch model`_
    1. `InRedis model and output-model`_
    2. `Indexing definition`_
    3. `Selectors`_

3. `Define application component`_
    1. `Auth-server`_
    2. `Command handler`_
    3. `Graphql resolvers`_
    4. `Data-graph service`_
    5. `Query handler service`_
    6. `Federated gateway`_

4. `Counter.unit-test`_
    1. `Launch Fedaterated Gateway`_
    2. `Run unit-test`_

Define domain model
-------------------

Events
~~~~~~

The simple counter accepts two business event ``Increment`` and ``Decrement``.

.. code:: typescript

    // packages/fabric-cqrs/src/unit-test-counter/events.ts

    interface Increment extends BaseEvent {
      readonly type: 'Increment';
      payload: {
        id: string;
        desc: string;
        // ...
      };
    }

Entity
~~~~~~

*Counter* is the entity type; which determines the current state of the counter, defined
by ``value`` field. ``id`` is mandaotory field for each entity.

.. code:: typescript

    // packages/fabric-cqrs/src/unit-test-counter/types/counter.ts

    interface Counter extends BaseEntity {
      id: string;
      value: number;
    }

Reducer
~~~~~~~

The reducer computes from the current state of the entity, from events history.

.. code:: typescript

    // packages/fabric-cqrs/src/unit-test-counter/reducer.ts

    import type { Reducer } from '../types';
    import type { CounterEvents } from './events';
    import type { Counter, CounterEvent } from './types';

    const counterReducer: Reducer<Counter> = (
      history: CounterEvent[],
      initial = { id: null, desc: null /* .... */ }
    ): Counter => history.reduce(reducerFcn, initial);
    // ...

Repository
~~~~~~~~~~
Repository provides data access abstraction via Repository Pattern. Its type ``CounterRepo``
is derived by type computation, ``Repository``

.. code:: typescript

    // Typing
    // packages/gateway-lib/src/__tests__/__utils__/types.ts

    import type { Counter, CounterEvent, Repository } from '@fabric-es/fabric-cqrs';

    type CounterRepo = Repository<Counter, OutputCounter, CounterEvents>;

``CounterRepo`` is used in `packages/gateway-lib/src/__tests__/__utils__/handler.ts`.

.. code:: typescript

    const commandHanlder: (option: {
      enrollmentId: string;
      counterRepo: CounterRepo;
    }) => CounterCommandHandler = ({ enrollmentId, counterRepo }) => ({
      Increment: async ({ userId, payload: { id } }) => {
        const { data, error } = await counterRepo.create({ enrollmentId, id }).save({
        // ...
        })

Define Redisearch model
-----------------------

`Redisearch` uses Redis hashes object, for data storage and indexing. This step
defines the domain models with Redisearch. Notice that Redis is a primiarly key-value
database. Also, it has naming convention, and data type restriction; so that the
data model used in Hyperledger Fabric and in Redis are likely incompatible.
Besides, it shall require additional fields in Redis, for a better search experienece.
Hence, a moderate complex scenario shall require different domain model definition.

InRedis model and output-model
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

As an example, *inRedis model* below uses shorter / lower-case field name.

.. code:: typescript

    // packages/fabric-cqrs/src/unit-test-counter/types/counter.ts

    // all fields here are persisted in Hyperledger Fabric
    interface Counter {
      id: string;
      desc: string;
      tag: string;
      value: number;
    }

    // packages/fabric-cqrs/src/unit-test-counter/types/counterInRedis.ts

    interface CounterInRedis {
      de: string; // renamed field
      event: string; // derived field
      id: string; // no change
      tag: string; // no change
      tl: string; // derived field
      val: string | number; // renamed field
      history: string; // derived field
    }

    // packages/fabric-cqrs/src/unit-test-counter/types/outputCounter.ts

    // the output counter restore CounterInRedis back, after search.
    interface OutputCounter {
      description: string;
      eventInvolved: string[]; // derived field
      id: string;
      tags: string[]; // derived field
      value: number;
    }

Indexing definition
~~~~~~~~~~~~~~~~~~~

Define which fields of Counter to save to Redis. Optionally step may pick some fields, and / or define
newly derived fields.

.. code:: typescript

    // Typing
    // packages/fabric-cqrs/src/unit-test-counter/types/counterIndexDefinition.ts

    type CommonCounterFields = Pick<Counter, 'id' | 'value' | 'desc' | 'tag'>;

    type DerivedFields = { event: string };

    type CounterIndexDefintion = RedisearchDefinition<PickedCounterFields & DerivedFields>;

``RedisearchDefinition`` computes the required fields. Notice that ``event`` is the newly dervied field,
which does not exist in original *Counter* model. Derived field is optional.

.. code:: typescript

    // Implementation
    // packages/fabric-cqrs/src/unit-test-counter/domain/counterIndexDefinition.ts

    const counterIndexDefinition: CounterIndexDefintion = {
      // original fields
      id: { index: { type: 'TEXT', sortable: true } },
      value: { altName: 'val' },
      // ...
      // derived fields
      event: { index: { type: 'TAG' } },
    };

In ``IndexDefinition``, (a) you can rename field from ``value`` to ``val``. It is useful, when the field name
in original model differs from the field name in Redis. Redis has difference naming constraint.
(b), you define index type per field; for example, ``TEXT``, ``NUMBERIC``, ``TAG``.

See `RediSearch Full Command Documentation <https://oss.redislabs.com/redisearch/Commands/>`__.

Selectors
~~~~~~~~~

Selectors are simple *selector* library by `reselect <https://github.com/reduxjs/reselect>`__. We use
`createStructuredSelector` to re-compute the models in different stages.

.. code:: text

    Counter ==> [Pre-Selector] ==> CounterInRedis ==> [Post-Selector] ==> OutputCounter

``CounterInRedis`` is in form of hash table. The input ``Counter`` may be a complex object. The *pre-selector*
transform to a stringified and flatten structure. The *post-selector* restores it.

.. code:: typescript

    // packages/fabric-cqrs/src/unit-test-counter/preSelector.ts

    // the input argument of preSelector is a tuple of Coutner, and its commit history.
    const preSelector: Selector<[Counter, Commit[]], CounterInRedis>
        = createStructuredSelector({
      // ...
    });

    // packages/fabric-cqrs/src/unit-test-counter/postSelector.ts

    const postSelector: Selector<CounterInRedis, OutputCounter>
        = createStructuredSelector({
      // ...
    });

Suppose the model is simple, so that derived field is not required; single type definition may be sufficient.
Also, *Selector* no longer required.

Define application component
----------------------------

Auth-server
~~~~~~~~~~~

For demo purpose, we develop a home-grown authorization server, see `auth-server <https://github.com/rtang03/auth-server>`__
repository. `packages/gateway-lib/src/utils/createGateway` accepts input argument ``authenticationCheck``,
url to *auth-server*.

.. code:: typescript

    // counter.unit-test.ts

    const apollo = await createGateway({
      serviceList: [{
        name: 'admin': url: 'http://localhost:15011/graphql'
        name: 'counter': url: 'http://localhost:15012/graphql'
      }],
      authenticationCheck: 'http://localhost:8080/oauth/authenticate'
    })

*auth-server* returns below ``AuthenticateResponse``. Notice that only ``user_id`` and ``username``
are OAuth2 supported fields. Others are custom fields; and optional.

.. code:: typescript

    // packages/gateway-lib/src/types/authenticateResponse.ts

    type AuthenticateResponse = {
      ok: boolean;
      authenticated: boolean;
      user_id: string;
      username: string;
      is_admin: boolean;
    };

Alternatively, we support `Auth0 identity provider <https://auth0.com>`__. Instead,
use `packages/gateway-lib/src/utils/createGatewayWithAuth0.ts`. Below tutorial is
based on custom auth-server. If you are interested with *Auth0* implementation,
see `packages/gateway-lib/src/__tests__/counter.auth0.unit-test.ts`.

.. note:: This is not part of federated gateway

Command handler
~~~~~~~~~~~~~~~

Command handler will send the events. Its type ``CounterCommandHandler`` is derived
by type computation, ``CommandHandler``.

.. code:: typescript

    // Typing
    // packages/gateway-lib/src/__tests__/__utils__/types.ts

    import type { CounterCommands } from '@fabric-es/fabric-cqrs';

    import type { CommandHandler } from '../..';

    type CounterCommandHandler = CommandHandler<CounterCommands>;

The ``Increment`` command save the new event ``[{ type: 'Increment' }]`` to ``counterRepo``.

.. code:: typescript

    // Implementation
    // packages/gateway-lib/src/__tests__/__utils__/handler.ts

    const commandHanlder: (option: {
      enrollmentId: string;
      counterRepo: CounterRepo;
    }) => CounterCommandHandler = ({ enrollmentId, counterRepo }) => ({
      Increment: async ({ userId, payload: { id } }) => {
        const { data, error } = await counterRepo.create({ enrollmentId, id }).save({
          events: [{ type: 'Increment', payload: { id } }],
        });
      },
      // ...
    });

Graphql resolvers
~~~~~~~~~~~~~~~~~

Graphql typeDefs (a.k.a. schema) and resolvers defines the endpoint, via the use of ``commandHandler``.
The mutation function `increment` invokes the ``Increment`` command of ``commandHandler``; returning
``Commit`` object, if it successfully writes to Fabric.

.. code:: typescript

    // Resolver Mutation
    // packages/gateway-lib/src/__tests__/__utils__/resolvers.ts

    const resolvers = {
      /** ... **/
      Mutation: {
        increment: catchResolverErrors(
          // catchResolverErrors decorates the orignal mutation function
          async (
            _,
            { counterId }, // variables
            {
              // Apollo Data Source
              dataSources: {
                counter: { repo },
              },
              user_id, // user_id will be saved in the event payload
              username, // authenticated username will be used as enrollmentId
            }: Context // Apollo Context bring in data source, i.e. counterRepo
          ): Promise<Commit> =>
            commandHanlder({ enrollmentId: username, counterRepo: repo }).Increment({
              userId: user_id,
              payload: { id: counterId /* ... */ },
            }),
          { fcnName: 'increment', logger, useAuth: true, useAdmin: false }
        ),
      },
      // ...

Optionally, you may use ``catchResolverErrors``; is a tryCatch high-order function, to provide
authentication guard per mutation call. The ``useAdmin`` validates ``is_admin`` boolean,
from Apollo context. Similarly, ``useAuth`` validates ``user_id``. Provided that standard
OAuth2 provider, ``is_admin`` does not exist.

.. important::

    For each authenticated request, ``createGateway`` passes the *Apollo Context*, with ``user_id``
    ``username`` to *resolvers*. Here assumes the ``username`` are ``enrollmentId`` of Fabric.FileWallet
    are identical. That means, each authenciated user will have individual identity in Fabric wallet.

    This design is under evaluation. And, may change later, if privacy-by-design is adopted.

For Apollo query, the *resolvers* utilize entity repository, to invoke *fullTextSearchEntity* api.
``repo.fullTextSearchEntity<OutputCounter>`` returns paginated response of ``OutputCounter``.

.. code:: typescript

    // Resolver Query
    // packages/gateway-lib/src/__tests__/__utils__/resolvers.ts

    const resolvers = {
      /* ... */
      Query: {
        search: catchResolverErrors(
          async (
            _,
            { query }: { query: string },
            {
              dataSources: {
                'gw-repo-counter': { repo },
              },
            }
          ): Promise<Paginated<OutputCounter>> => {
            const { data, error, status } = await repo.fullTextSearchEntity<OutputCounter>({
              entityName: 'gw-repo-counter',
              query,
            });
            return data;
          }
        ),
      },
      // ...
    };

You also need to define schema, as in `packages/gateway-lib/src/__tests__/__utils__/typeDefs.ts`.
Details omits here.

Data-graph service
~~~~~~~~~~~~~~~~~~

*Counter* Data-graph service shall use ``Repository``. It does not use private data; so ``PrivateRepository``
is not required. There are two steps by ``createService``.

  1. configure persistence with Fabric's connection profile, FileWallet, and Redis client connection.
  2. configure graphql endpoint

.. code:: typescript

    // packages/gateway-lib/src/__tests__/counter.unit-test.ts

    // (1) configure persistence
    const { config } = await createService({
      asLocalhost: true,
      channelName,
      connectionProfile,
      serviceName: 'counter',
      enrollmentId: orgAdminId,
      wallet,
      redisOptions,
    });

    // (2) configure Apollo typeDefs and resolvers
    apolloService = config([{ typeDefs, resolvers }])
      // note: type argument for addRepository is optional
      .addRepository<Counter, CounterInRedis, OutputCounter, CounterEvents>(Counter, {
        // define the Redisearch index, and selectors
        reducer: counterReducerCallback,
        fields: counterIndexDefinition,
        postSelector: counterPostSelector,
        preSelector: counterPreSelector,
      })
      .create();

When configuring endpoint, you need `typeDefs`, `resolvers`, `reducer`, `indexDefinition`, `selectors`,
`models` and `events` from previous steps. It returns `Apollo server` of data-graph service.


Query handler service
~~~~~~~~~~~~~~~~~~~~~

Each organization shall deploy one query handler service; at which you may add one or more ``addRedisRepository``.
``.run()`` is essential, which performs below bootstrapping tasks at query handler, under the hood.

    1. connect Redis store with ``RedisOption``
    2. connect Fabric peer with  ``connectionProfile``
    3. drop and re-build RediSearch indices
    4. contract listener subscribe to Fabric channel hub
    5. clean up pre-existing cached commit and entity
    6. reconcile from on-chain ledger to Redis

Notice that two system-level entity, `organization` and `user` are automatically
added via ``addRedisRepository``.

.. code:: typescript

    // packages/gateway-lib/src/__tests__/counter.unit-test.ts

    const qhService = await createQueryHandlerService({
      asLocalhost: process.env.NODE_ENV !== 'production',
      authCheck: `http://localhost:8088/oauth/authenticate`,
      channelName,
      connectionProfile,
      enrollmentId,
      redisOptions: { host: 'localhost', port: 6379 },
      wallet,
    })
      // note: type argument for addRedisRepository is optional
      .addRedisRepository<Counter, CounterInRedis, OutputCounter, CounterEvents>(
        Counter, {
          reducer: counterReducerCallback,
          fields: counterIndexDefinition,
          postSelector: counterPostSelector,
          preSelector: counterPreSelector,
        })
      .run();

Federated gateway
~~~~~~~~~~~~~~~~~

See `Auth-server`_ section; either ``createGateway`` or ``createGatewayWithAuth0`` create federated gateway.

.. code:: typescript

    // packages/gateway-lib/src/utils/createGatewayWithAuth0.ts

    const createGatewayWithAuth0: (option: {
      serviceList?: any;
      authenticationCheck: string;
      useCors?: boolean;
      corsOrigin?: string;
      debug?: boolean;
      enrollmentId: string;  // <= Organization Admin ID
      customExpressApp?: Express;
    }) => Promise<http.Server> = async ({
    // ...

.. important::

    ``createGatewayWithAuth0`` has slightly different design. It has additional input argument
    ``enrollmentId``; it shall input *organizational administrator ID*. He will submit Fabric
    transactions on behalf of individual user. Individual user are no longer required to
    register / enroll himself to Fabric CA server. This is an attempt to de-link
    identity from Fabric transaction, for sake of privacy-by-design.

    This design is experimental; may change later.

Counter.unit-test
-----------------

.. code:: bash

    ## Make sure `dev-net` is running, before executing the unit-test, e.g.

    cd dev-net
    ./dn-run.sh 2 auth

The funniest part is here; every part are glued together. Full source is here,
`/packages/gateway-lib/src/__tests__/counter.unit-test.ts`.

Launch Fedaterated Gateway
~~~~~~~~~~~~~~~~~~~~~~~~~~

**Step 1: Create initial wallet entry**

.. code:: typescript

  const wallet = await Wallets.newFileSystemWallet(walletPath);

**Step 2: Enroll organization administrator**

.. code:: typescript

    await enrollAdmin({
      enrollmentID: orgAdminId,
      enrollmentSecret: orgAdminSecret,
      // ...
    });

**Step 3: Enroll Fabric-CA administrator**

.. code:: typescript

    await enrollAdmin({
      enrollmentID: caAdmin,
      enrollmentSecret: caAdminPW,
      // ...
    });

**Step 4: Prepare Query handler service**

.. code:: typescript

    const qhService = await createQueryHandlerService({
      /*...*/
    });

**Step 5: Launch Query handler service**

.. code:: typescript

    await queryHandlerServer.listen({ port });

**Step 6: Configure persistence for Counter data-graph service**

.. code:: typescript

    const { config } = await createService({
      /* ... */
    });

**Step 7: Configure Apollo schema and resolvers for Counter data-graph service**

.. code:: typescript

    modelApolloService = config([{ typeDefs, resolvers }])
      .addRepository<Counter, CounterInRedis, OutputCounter, CounterEvents>(Counter, {
        reducer: counterReducerCallback,
        fields: counterIndexDefinition,
        postSelector: counterPostSelector,
        preSelector: counterPreSelector,
      })
      .create();

**Step 8: Launch Counter data-graph service**

.. code:: typescript

    await modelApolloService.listen({ port });

**Step 9: Launch Federated Gateway =**

.. code:: typescript

    app = await createGateway({
      serviceList: [{ name: 'counter', url }],
      authenticationCheck: `${proxyServerUri}/oauth/authenticate`,
    });

Run unit-test
~~~~~~~~~~~~~

**Step 10: Register new user at auth-server**

.. code:: typescript

    await fetch(`http://localhost:8080/account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

**Step 11: Login to to obtain accessToken**

.. code:: typescript

    await fetch(`http://localhost:8080/account/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
      .then((r) => r.json())
      .then((res) => {
        accessToken = res.access_token; // accessToken is obtained
      });


**Step 12: Create server-side wallet entity for newly created user**

This is *Admin* federated service, not *auth-server* to create wallet entry. ``accessToken`` is required
to submit the request. It is exposed via Federated Gateway; therefore, the payload of http request is
in form of graphql query syntax.

.. code:: typescript

    await request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'CreateWallet',
        query: CREATE_WALLET,
      })
      .expect(({ body: { data, errors } }) => {
        /* ... */
      });

**Step 13: Send Increment command to Federated Gateway**

Again, it sends http request, to invoke `INCREMENT` command.

.. code:: typescript

    await request(app)
      .post('/graphql')
      .set('authorization', `bearer ${accessToken}`)
      .send({
        operationName: 'Increment',
        query: INCREMENT,
        variables: { counterId, id: counterId },
      })
      .expect(({ body: { data, errors } }) => {
        /* ... */
      });

Below shows the ``INCREMENT`` query, and returning the standard ``Commit`` object.

.. code:: text

    // packages/gateway-lib/src/__tests__/__utils__/INCREMENTts

    const INCREMENT = `
      mutation Increment ($counterId: String!) {
        increment (
          counterId: $counterId
        ) {
          id
          entityName
          version
          commitId
          entityId
        }
      }
    `;
