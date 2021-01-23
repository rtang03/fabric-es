![Build](https://github.com/rtang03/fabric-es/workflows/CI/badge.svg?branch=master)
![Release](https://github.com/rtang03/fabric-es/workflows/Create%20Release/badge.svg)
![Changelog](https://github.com/rtang03/fabric-es/workflows/Changelog/badge.svg)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

**Test Purpose Only; Not ready for use**  

# Project Overview

This project enables event-driven architecture for Hyperledger Fabric projects. It provides a collection of library
packages to accelerate development of Hyperledger Fabric application stack.

See [Concept](https://github.com/rtang03/fabric-es/docs/CONCEPT.md)

### Package libraries

This monerepo includes three package libraries.

1. `fabric-cqrs` is the utility to write data to Hyperledger Fabric, and query data from Redis/RediSearch.
1. `gateway-lib` creates Apollo federated gateway, along with entity-based microservice (in form of Apollo server)
1. `operator` is utility library for system administrative works.

# Simple-counter example

Let start with simple-counter example. See [simple-counter](https://github.com/rtang03/fabric-es/blob/master/packages/gateway-lib/src/__tests__/__utils__/)

## Application Architecture

The application is developed based on [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html).

_Dependency graph_

```text
(1) fabric.Wallet & fabric.connectionProfile & Redis
    ⎿ entity microservice (aka api gateway)
        ⎿ typeDefs
        ⎿ resolvers
           ⎿ command handler
               ⎿ repository
                    ⎿ event
                    ⎿ entity
                    ⎿ reducer
(2) fabric.Wallet & fabric.connectionProfile & Redis & Reducers & authCheck
    ⎿ query handler microservice
        ⎿ typeDefs
        ⎿ resolvers
            ⎿ query handler
                ⎿ query database
                    ⎿ reducers (reducer map)

```

### Step 1: Define domain model

Here adopts the [Domain-driven design](https://en.wikipedia.org/wiki/Domain-driven_design). _Event_, _Entity_, _Reducer_
and _Repository_ are most fundamental model elements.

**Events**

The simple counter accepts two event `Increment` and `Decrement`.

```typescript
// Typing
// packages/fabric-cqrs/src/unit-test-reducer/events.ts
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
// packages/fabric-cqrs/src/unit-test-reducer/reducer.ts
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
type CounterRepo = Repository<Counter, CounterEvent>;
```

The function `getRepository` gives `counterRepo`, the realization of counter repository.

```typescript
// Implementation
// packages/gateway-lib/src/__tests__/counter.unit-test.ts
const entityName = 'counter';
const counterRepo = getRepository<Counter, CounterEvents>(entityName, counterReducer);
```

### Step 2: Define application architecture

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
// Implementation
// packages/gateway-lib/src/__tests__/__utils__/resolvers.ts
export const resolvers = {
  Mutation: {
    increment: catchErrors( // catchErrors decorates the orignal mutation function
      async (
        _,
        { counterId },  // variables
        {               // Apollo Data Source
          dataSources: {
            counter: { repo },
          },
          user_id,     // user_id will be saved in the event payload
          username,    // authenticated username will be used as enrollmentId
        }: Context     // Apollo Context bring in data source, i.e. counterRepo
      ): Promise<Commit> =>
        commandHanlder({ enrollmentId: username, counterRepo: repo }).Increment({
          userId: user_id,
          payload: { id: counterId, /* ... */ },
        }),
      { fcnName: 'increment', logger, useAuth: true, useAdmin: false }
    ),
}
```

**Entity microservice**

Entity microservice configures Apollo federated service, based on `counter` models, and resolvers.

```typescript
// packages/gateway-lib/src/__tests__/counter.unit-test.ts
// (1) inject persistence
const { config, getRepository } = await createService({
  asLocalhost: true,
  channelName,
  connectionProfile,
  serviceName: 'counter',
  enrollmentId: orgAdminId,
  wallet,
  redisOptions,
});

// (2) inject Apollo typeDefs and resolvers
modelApolloService = await config({ typeDefs, resolvers })
  .addRepository(getRepository<Counter, CounterEvents>(entityName, counterReducer))
  .create();
```

**QueryHandler microservice**

Query handler microservice is a single microservice per organization. It is NOT part of federated services.
In current release, query handler microservice is partially configurable. You are not required
to define the `typeDefs`, and `resolvers`, query database indexes. You need to provide reducer map,
like `{ counter: counterReducer }`. Future release will give better configurability.

```typescript
// packages/gateway-lib/src/__tests__/counter.unit-test.ts
const qhService = await createQueryHandlerService(['counter'], {
  redisOptions: { host: 'localhost', port: 6379 },
  asLocalhost: true,
  channelName,
  connectionProfile,
  enrollmentId,
  reducers: { counter: counterReducer },
  wallet,
  authCheck: `http://localhost:8080/oauth/authenticate`,
});
```

### Step 3: Bootstrap it

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
const qhService = await createQueryHandlerService(['counter'], {
  /*...*/
});

// (5) Setup Redis cidx and eidx indexes
await rebuildIndex(publisher, logger);

// (6) Launh queryHander non-federated service
await queryHandlerServer.listen({ port });

// (7) Prepare Counter microservice
const { config, getRepository } = await createService({
  /* ... */
});

// (8) Config Apollo with typeDefs, resolver, and repository
modelApolloService = await config({ typeDefs, resolvers })
  .addRepository(getRepository<Counter, CounterEvents>(entityName, counterReducer))
  .create();

// (9) Launch Counter federated service
await modelApolloService.listen({ port });

// (10) Start federated API gateway
app = await createGateway({
  serviceList: [{ name: 'counter', url }],
  authenticationCheck: `${proxyServerUri}/oauth/authenticate`,
});
```

### Step 4: Register / Login / Invoke Tx

```typescript
// (11) Reister new user, targeting RESTful auth-server
await fetch(`http://localhost:8080/account`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, email, password }),
});

// (12) Login new user
await fetch(`http://localhost:8080/account/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
})
  .then((r) => r.json())
  .then((res) => {
    accessToken = res.access_token; // accessToken is obtained
  });

// (13) Create server side digital wallet, targeting Apollo federated gateway;
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

// (14) Increment counter, targeting Apollo federated gateway;
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
deployment will be running with k8s.

```shell
cd dev-net
./dn-run.2-db-red-auth.sh
```

## Advanced example

`packages/gw-orgX` & `package/model-X` provide advanced example, about how multiple organizations gateways are configured.
