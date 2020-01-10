### Chaincodes

`eventstore` is the chaincode on channel `eventstore`, accessible by all peer node. Note
that both channel name and chaincodeId are `eventstore`.

`privatedata` is the chaincode, using Hyperledger Farbic private feature. As an example implementation,  
it has two collection `Org1PrivateDetails` and `Org1PrivateDetails`, defined in `collection.json` of
`@espresso/chaincode` package.

### Pre-requisite

Under the `network` directory, setup multiple CA environment.

### In a new terminal, start the network

```shell script
// cd project-root/network
docker-compose up -d

// Start logger
./monitordocker.sh net_byfn
```

### Build chaincode

```shell script
// cd packages/chaincode
yarn build
```

### Install and instantiate eventstore chaincode

```shell script
// cd packages/admin-tool
yarn run test:install-instantiate-eventstore
```

### Upgrade chaincode for eventstore

```shell script
yarn run test:install-upgrade-eventstore
```

// if development requires installation of version 0 chaincode
// remember to clean pre-existing version 0 chaincode container
// upgrade chaincode does not require to clean up.
// continue debug chaincode

### Restart Network

assume no need to re-setup CA servers

```shell script
// cd network
docker-compose down
docker rm logspout -f
docker rm $(docker ps -aqf "name=dev") -f
docker rmi $(docker images -q "dev-*")
docker-compose up -d
./monitordocker.sh
```

_Important Note:_   
See _createInstance_  `src/ledger-api/utils.ts`, the commitId is created 
based on timestamp in ms. While the chaincodes will invoke at different times, 
the same transaction in different chaincode will result in different commitId. 
This introduces error of repeated createCommit, and result in error world state.
As a workaround, truncate the timestamp by 2 digits, which add extra time tolerance
to handle the different chaincode invocation time. But this imposes new constraint
that same entityId cannot be invoked at > 10 TPS. 

It should revisit this arrangement, when running performance test on cloud.  
