Glossary
---------

Client Application Developer
  He develops the client application to consume the data services from Federated API Gateway.

Command Handler
  A command handler receives command from the aggregate.

Domain model
  This is a broader definition than the conventional meaning of DDD. Domain models in `fabric-es`
  includes (1) conventional DDD domain model, (2) Redis models and indexing definition, and Apollo
  endpoint definition. For example, *typeDefs*, *resolvers*, *events*, *models*, *reducer*, *indexDefinition*.

Federated API Gateway
  also known as, *Apollo Federated API Gateway*; giving API endpoint to compose data graphs from underlying
  micro-service. Also, it may give `/healthz`, which performs health check monitoring, for underlying service.
  This gateway does NOT replace API gateway of client application. The client application is free to choose
  any type of API gateway technology.

Federated service
  There are threee types, (1) administrative service, (2) data-graph service, and
  (3) remote-data microservice.

  *Data Graph Microservice* exposes Apollo federated service. The Gateway developer models the data graph for
  for one `DDD Aggregate <https://martinfowler.com/bliki/DDD_Aggregate.html#:~:text=A%20DDD%20aggregate%20is%20a,items)%20as%20a%20single%20aggregate.>`__.

Gateway Developer
  He develops the federated API gateway and underlying federated microservice.

Identity Wallet
  Servers-side digital wallet, carrying list of X.509 ecert. This is generated during
  Fabric-CA user enrollment process. It is now using Fabric's file wallet, residing
  under the Federated API Gateway. All transaction written to Fabric network requires
  corresponding X.509 ecert obtained from this wallet.

Model-free chaincode
  Chaincode implementation which does not carry any domain model / data model inforrmation.
  That means, changes in model does not require code refactoring in chaincode.

Network Operator
  He runs (1) Org0 - orderers; (2) Org1 - administratrive peer-node. Optionally, as a
  value-added service, he may also run peer-nodes from other organizations.

Repository Pattern
  Repository provides abstraction of data, so that applcation can work with simple abstraction.
  See `Repository Pattern <https://deviq.com/design-patterns/repository-pattern>`__.
