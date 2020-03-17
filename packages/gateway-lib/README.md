### Enrol Admin

If admin is not previously enrolled, or the network is redeployed, need to run

```shell script
yarn run enrollAdmin
```

### Start runtime servers

There requires two steps:

```shell script
// start federated services in terminal 1
yarn run start-services

// start Apollo Gateway in terminal 2
yarn run start-gateway
```

### Run Test

To run either unit test or integration test, does NOT start runtime servers.

```shell script
yarn run test:unit

// OR

yarn run test:integration
```

### Play with Apollo Playground

To play with playground, start runtime servers.

While the peer-node is JWT protected, via Auth0 service; Add below to the headers of Apollo Playground

```json
{
  "authorization": "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6Ik9FWkVNREEzTnpNNU5rWkVRems0TWpaRlF6QTRSVEZGT0VOQ05VRkZRVVEwTmtNNE4wVkNOdyJ9.eyJpc3MiOiJodHRwczovL3Rhbmdyb3NzLmF1dGgwLmNvbS8iLCJzdWIiOiJJZlpwNVBXWHJJVDM2TnBjUEdOdDliYVZtSkJmMGVrOUBjbGllbnRzIiwiYXVkIjoidXJuOmVzcHJlc3NvIiwiaWF0IjoxNTcyMzI5NDQzLCJleHAiOjE1NzI0MTU4NDMsImF6cCI6IklmWnA1UFdYcklUMzZOcGNQR050OWJhVm1KQmYwZWs5IiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.EWt8D2xQgrOH8hB9rBuwiuMv7sln-O2vu-0fOt7Iz3lOAOPHxb-6I6n9JvtYO80mHMITpq3rhrNJX03KxEDc3y798lKdPUwGgUuCYAvCaDFzjyOtQeygeZCCPwvFbMVlhzUo7-RdrvflJid33z87YudKV-kYYjcV0JjiAW3sOvXlogBt9LAMirIhO74O_QL4uwxADcqfCVeNBTTqdMzHdh-ZG0ZKeyi_QRFBHdjFqxCyNEN8bBh_U4z7zn_-KJgI92T1cRubHMzMS249A6vnAW17Ff38W_oPqezg4g5QEdIcAw6KDmNy4rEcxpD4N9vU4HQa-nFqcX4WuXEpQo8LuA"
}
```

### Reference

[Fabric-postgres-wallet](https://github.com/IBM/fabric-postgres-wallet)