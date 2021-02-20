### Note:

`store` is the standard Redux architecture. Along with `redux-observables`, it acts a Reactive Functional Programming
layer between CommandHandler / QueryHandler, and data layer ( Redis and Hyperledger ). It is the core CQRS pattern.

- Projection epics: when new entity arrives the Hyperledger peer, the contract listener will send it to Redis
- Command epics: write to Hyperledger
- Query epics: read from Redis
- Reconcile: reconcile commit, during bootstrapping steps

The codes here are all internal implementation, and will not be published via typedoc.
