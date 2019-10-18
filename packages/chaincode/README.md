### Chaincodes

`eventstore` is the chaincode on channel `eventstore`, accessible by all peer node.

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
### Clean-up

```shell script
cd fabric-samples/first-network
docker rm logspout -f
docker rm $(docker ps -qf "name=cliOrg") -f
docker rm $(docker ps -aqf "name=dev") -f
docker-compose -f docker-compose-e2e.yaml down --volumes
// docker rm $(docker ps -aq)
docker volume prune -f
docker rmi $(docker images -q "dev-*")
rm channel-artifacts/genesis.block channel-artifacts/channel.tx
```

### Clean up command #2 for NGAC development

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
