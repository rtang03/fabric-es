![Build](https://github.com/rtang03/fabric-es/workflows/CI/badge.svg?branch=master)
![Release](https://github.com/rtang03/fabric-es/workflows/Create%20Release/badge.svg)
![Changelog](https://github.com/rtang03/fabric-es/workflows/Changelog/badge.svg)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

# Project Overview

This project aims to provide event-driven architecture for Hyperledger Fabric projects. It provides a collection of library
packages to accelerate development of Hyperledger Fabric application stack.

See [Concept](https://github.com/rtang03/fabric-es/docs/CONCEPT.md)

# Basic components

**Commit**

Data is written into Fabric in form of _commit_. The type definition is fixed. 

```typescript
interface Commit {
  /** commit Id */
  id: string;
  /** entity name */
  entityName: string;
  /** version number */
  version?: number;
  /** commit Id */
  commitId?: string;
  /** entity Id */
  entityId?: string;
  /** organization Id */
  mspId?: string;
  /** events array */
  events?: BaseEvent[];
  /** hash of privatedata's events string */
  hash?: string;
  /** stringified events*/
  eventsString?: string;
}
```

**BaseEvent**

Every _commit_ contains one / multiple _event_. The type definition is fixed. 

```typescript
interface BaseEvent {
  /** event type */
  readonly type?: string;
  /** lifecycle type */
  readonly lifeCycle?: Lifecycle;
  /** event payload */
  payload?: any;
}
```

**Reducer**

The _reducer_ computes the final state of entity, from event history. The type definition is not fixed; it is defined
by modeler. 

```typescript
type Reducer<TEntity = any> = (
  history: { type: string; payload?: any }[],
  initial?: TEntity
) => TEntity;
```

### Example: How to model a simple counter

**Event**

```typescript
// packages/fabric-cqrs/src/unit-test-reducer/events.ts

interface Increment extends BaseEvent {
  readonly type: 'Increment';
  payload: {
    id: string;
    desc: string;
    tag: string;
  };
}

interface Decrement extends BaseEvent {
  readonly type: 'Decrement';
  payload: {
    id: string;
    desc: string;
    tag: string;
  };
}
```

**Reducer**

```typescript
// packages/fabric-cqrs/src/unit-test-reducer/reducer.ts
const reducer: Reducer<Counter> = (
  history: CounterEvent[],
  initial = { id: null, desc: null, tag: null, value: 0 }
): Counter => history.reduce(reducerFcn, initial);

const reducerFcn = (state, { type, payload: { id, desc, tag } }: CounterEvents) =>
  ({
    Increment: {
      ...state,
      value: state.value + 1,
      id,
      desc,
      tag,
    },
    Decrement: {
      ...state,
      value: state.value - 1,
      id,
      desc,
      tag,
    },
  }[type] || state);
```

**Repository**

*Repository* is function factory, for manipulating data, in form repository pattern. Each entity type shall require one
*Repository*, and optionally one *PrivateRepository*. The *PrivateRepository* writes data to private data of Fabric, with
implicit collection. 

```typescript

```
**enrollAdmin**  

**CreateRepository**

**CreatePrivateRepository**

**TypeDef**

**Resolver**

### Packages

### dev-net
