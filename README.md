![Build](https://github.com/rtang03/fabric-es/workflows/CI/badge.svg?branch=master)
![Release](https://github.com/rtang03/fabric-es/workflows/Create%20Release/badge.svg)
![Changelog](https://github.com/rtang03/fabric-es/workflows/Changelog/badge.svg)
[![CodeQL](https://github.com/rtang03/fabric-es/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/rtang03/fabric-es/actions/workflows/codeql-analysis.yml)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

# Project Overview

This project enables event-driven architecture for Hyperledger Fabric projects. It provides a collection of library
packages to accelerate development of Hyperledger Fabric application stack.

- See [Full Documentation](https://fabric-es.readthedocs.io/en/latest/)
- See [TypeDocs](https://rtang03.github.io/fabric-es/)

### Package libraries

This monerepo includes package libraries.

1. `fabric-cqrs` is the utility to write data to Hyperledger Fabric, and query data from Redis/RediSearch.
1. `gateway-lib` creates Apollo federated gateway, along with entity-based microservice (in form of Apollo server)

# Simple-counter example

Let start with simple-counter example. See [simple-counter](https://github.com/rtang03/fabric-es/blob/master/packages/gateway-lib/src/__tests__/__utils__/)

## Application Architecture

The application is developed based on [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html).

_Dependency graph_

```text
(1) -- data-graph service for on-chain data
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
(2) -- Query handler service
        ⎿ Input-argument < FileWallet, connectionProfile,  Redis connection, auth-server >
        ⎿ typeDefs
        ⎿ Resolvers
           ⎿ Query handler
             ⎿ Input-argument < event, model, reducer >
             ⎿ Query Database (internal)
                  ⎿ RedisRepository (internal)
                      ⎿ Input-argument < IndexDefinition, inRedisModel, outputModel, Selectors >

```

### Step 1: Define domain model

Here adopts the [Domain-driven design](https://en.wikipedia.org/wiki/Domain-driven_design). _Event_, _Entity_, _Reducer_
and _Repository_ are most fundamental model elements.

**Events**

The simple counter accepts two event `Increment` and `Decrement`.

```typescript
// Typing
// packages/fabric-cqrs/src/unit-test-counter/events.ts
interface Increment extends BaseEvent {
  readonly type: 'Increment';
  payload: {
    id: string;
    desc: string;
    // ...
  };
}
```

**Entity**

The entity, named `Counter`, determines the current state of the counter, defined
by `value` field.

```typescript
interface Counter extends BaseEntity {
  id: string;
  value: number;
}
```

**Reducer**

The reducer computes from the current state of the entity, from events history.

```typescript
// packages/fabric-cqrs/src/unit-test-counter/reducer.ts
import { Reducer } from '../types';
import { CounterEvents } from './events';
import { Counter, CounterEvent } from './types';

const counterReducer: Reducer<Counter> = (
  history: CounterEvent[],
  initial = { id: null, desc: null /* .... */ }
): Counter => history.reduce(reducerFcn, initial);
// ...
```

**Repository**

Repository provides data access abstraction via [repository pattern](https://martinfowler.com/eaaCatalog/repository.html).
Its type `CounterRepo` is derived by type computation, `Repository`

```typescript
// Typing
// packages/gateway-lib/src/__tests__/__utils__/types.ts
import { Counter, CounterEvent, Repository } from '@fabric-es/fabric-cqrs';
type CounterRepo = Repository<Counter, OutputCounter, CounterEvents>;
```

`CounterRepo` will be used in `packages/gateway-lib/src/__tests__/__utils__/handler.ts`.

```typescript
export const commandHanlder: (option: {
  enrollmentId: string;
  counterRepo: CounterRepo;
}) => CounterCommandHandler = ({ enrollmentId, counterRepo }) => ({
  Increment: async ({ userId, payload: { id } }) => {
    const { data, error } = await counterRepo.create({ enrollmentId, id }).save({
    // ...
    })
```

### Step 2: Define additional model for Redisearch

`Redisearch` uses Redis hashes object, for data storage and indexing. This step defines the domain models with Redisearch.
Notice that Redis is a primiarly key-value database. Also, it has naming convention, and data type restriction; so that
the data model used in Hyperledger Fabric and in Redis are likely incompatible. Besides, it shall require additional
fields in Redis, for a better search experienece. Hence, a moderate complex scenario shall require different domain
model definition. See below example.

```typescript
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
```

### Step 3: Define indexing definition for Redisearch

Define which fields of Counter to save to Redis. Optionally step may pick some fields, and / or define
newly derived fields.

```typescript
// packages/fabric-cqrs/src/unit-test-counter/types/counterIndexDefinition.ts
export type CommonCounterFields = Pick<Counter, 'id' | 'value' | 'desc' | 'tag'>;
type DerivedCounterFields = { event: string };
type CounterIndexDefintion = RedisearchDefinition<PickedCounterFields & DerivedCounterFields>;
```

**IndexDefinition**

Define the indexing definition

```typescript
// packages/fabric-cqrs/src/unit-test-counter/domain/counterIndexDefinition.ts
const counterIndexDefinition: CounterIndexDefintion = {
  // original fields
  id: { index: { type: 'TEXT', sortable: true } },
  value: { altName: 'val' },
  // ...
  // derived fields
  event: { index: { type: 'TAG' } },
};
```

**Selector**

_preSelector_ and _postSelector_ define the transformation.

```typescript
// packages/fabric-cqrs/src/unit-test-counter/preSelector.ts
// the input argument of preSelector is a tuple of Coutner, and its commit history.
const preSelector: Selector<[Counter, Commit[]], CounterInRedis> = createStructuredSelector({
  // ...
});

// packages/fabric-cqrs/src/unit-test-counter/postSelector.ts
const postSelector: Selector<CounterInRedis, OutputCounter> = createStructuredSelector({
  // ...
});
```

Suppose the model is simple, so that derived field is not required; single type definition may be sufficient.
Also, _Selector_ no longer required.

### Step 4: Define application architecture

📌 IMPORATNT NOTE: There are two authentication approaches, via:

- legacy [auth-server](https://github.com/rtang03/auth-server), it will call with `createGateway.ts`
- [Auth0 Identity Provider](https://auth0.com) (recommended), it will call with `createGatewayWithAuth0.ts`

Below example is based on legacy auth-server. If you are interested with Auth0 authentication,
please see `packages/gateway-lib/src/__tests__/counter.auth0.unit-test.ts`.

There are serveral technical constructs, _commandHandler_, _resolvers_, _queryHandler microservice_, and
_entity microservice_. They are not carrying domain model information. They are defining the architecture how
the data can be consumed. The entity microservice defines the api endpoint(s); giving _Apollo_ federated
microservice.

**Command handler**

Command handler will send the events. Its type `CounterCommandHandler` is derived by type computation, `CommandHandler`.

```typescript
// Typing
// packages/gateway-lib/src/__tests__/__utils__/types.ts
import { CounterCommands } from '@fabric-es/fabric-cqrs';
import { CommandHandler } from '../..';
type CounterCommandHandler = CommandHandler<CounterCommands>;
```

Also, the implementation as below. The `Increment` command save the new event `[{ type: 'Increment' }]`
to `counterRepo`.

```typescript
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
```

**Graphql resolvers**

Graphql resolvers defines the endpoint behaviours, via the use of `commandHandler`. The mutation function
`increment` invokes the `Increment` command of `commandHandler`; and returning `Commit` object, if it
successfully writes to Fabric.

```typescript
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
};
```

On the query side, the _resolvers_ utilize entity repository, to invoke _fullTextSearchEntity_ api.

```typescript
// Resolver Query
// packages/gateway-lib/src/__tests__/__utils__/resolvers.ts
const resolvers = {
  /** ... */
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
```

**Entity microservice**

Entity microservice configures Apollo federated service, based on `counter` models, and resolvers. Each
entity microservice may define one or mulitple _Repository_ or _RedisRepository_. `addRedisRepository`
requires the input argument from previous steps, e.g. indexDefinition and Selector.

```typescript
// packages/gateway-lib/src/__tests__/counter.unit-test.ts
// (1) inject persistence
const { config } = await createService({
  asLocalhost: true,
  channelName,
  connectionProfile,
  serviceName: 'counter',
  enrollmentId: orgAdminId,
  wallet,
  redisOptions,
});

// (2) inject Apollo typeDefs and resolvers
modelApolloService = config([{ typeDefs, resolvers }])
  // define the Redisearch index, and selectors
  .addRepository<Counter, CounterInRedis, OutputCounter, CounterEvents>(Counter, {
    reducer: counterReducerCallback,
    fields: counterIndexDefinition,
    postSelector: counterPostSelector,
    preSelector: counterPreSelector,
  })
  .create();
```

**QueryHandler microservice**

Query handler microservice is a single microservice per organization. It is NOT part of federated services.
It is partially configurable. You are not required to define the `typeDefs`, and `resolvers`. You are only
required to define indexes, AND organziational-wide reducer map, like `{ counter: counterReducer }`.

```typescript
// packages/gateway-lib/src/__tests__/counter.unit-test.ts
const qhService = await createQueryHandlerService({
  asLocalhost: !(process.env.NODE_ENV === 'production'),
  authCheck: `${proxyServerUri}/oauth/authenticate`,
  channelName,
  connectionProfile,
  enrollmentId,
  redisOptions: { host: 'localhost', port: 6379 },
  wallet,
})
  .addRedisRepository<Counter, CounterInRedis, OutputCounter, CounterEvents>(
    Counter, {
      reducer: counterReducerCallback,
      fields: counterIndexDefinition,
      postSelector: counterPostSelector,
      preSelector: counterPreSelector,
    })
  .run();
```

### Step 5: Bootstrap it

The funniest part is here, when every part are glued together.

📌 Make sure `dev-net` is running, before executing the unit-test above.

```typescript
// Full implementation is here
// ./packages/gateway-lib/src/__tests__/counter.unit-test.ts

// (1) Wallet
const wallet = await Wallets.newFileSystemWallet(walletPath);

// (2) Enroll Admin
await enrollAdmin({
  enrollmentID: orgAdminId,
  enrollmentSecret: orgAdminSecret,
  // ...
});

// (3) Enroll Ca Admin
await enrollAdmin({
  enrollmentID: caAdmin,
  enrollmentSecret: caAdminPW,
  // ...
});

// (4) Start QueryHandler
const qhService = await createQueryHandlerService({
  /*...*/
});

// (5) Launh queryHander non-federated service
await queryHandlerServer.listen({ port });

// (6) Prepare Counter microservice
const { config } = await createService({
  /* ... */
});

// (7) Config Apollo with typeDefs, resolver, and repository
modelApolloService = config([{ typeDefs, resolvers }])
  // define the Redisearch index, and selectors
  .addRepository<Counter, CounterInRedis, OutputCounter, CounterEvents>(Counter, {
    reducer: counterReducerCallback,
    fields: counterIndexDefinition,
    postSelector: counterPostSelector,
    preSelector: counterPreSelector,
  })
  .create();

// (8) Launch Counter federated service
await modelApolloService.listen({ port });

// (9) Start federated API gateway
app = await createGateway({
  serviceList: [{ name: 'counter', url }],
  authenticationCheck: `${proxyServerUri}/oauth/authenticate`,
});
```

### Step 6: Register / Login / Invoke Tx

```typescript
// (10) Reister new user, at auth-server
await fetch(`http://localhost:8080/account`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, email, password }),
});

// (11) Login new user
await fetch(`http://localhost:8080/account/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
})
  .then((r) => r.json())
  .then((res) => {
    accessToken = res.access_token; // accessToken is obtained
  });

// (12) Create server side digital wallet, targeting Apollo federated gateway;
// authtenicated with above accessToken
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

// (13) Increment counter, at Apollo federated gateway;
// authtenicated with above accessToken
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
```

## dev-net

`dev-net` provisions different development networks, based on docker-compose. Notice that the upcoming production
deployment will be running with k8s. For common development scenario, may use `./dn-run.sh 2 auth`,
which is 2-org Fabric setup, with Redis, and auth-server.

```shell
cd dev-net
./dn-run.sh 2 auth
```

## Advanced example

`packages/gw-orgX` & `package/model-X` provide advanced example, about how multiple organizations gateways are configured.
