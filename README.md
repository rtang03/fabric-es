### Overview

This package aims to implement basic commands for bootstrap Trade platform. This middleware fucntiona shall later enable
to develop more robust Blockchain-as-a-service platform.

Currently, it shall perform:

- Create a trade channel (or blockchain instance)
- Join peers of all the organizations to this channel
- Install the chaincode on every peer joined to the channel
- Instantiate the chaincode on this channel
- Enrol org admin, and create file system wallet
- Register and enrol new user, and create file system wallet

_Next actions_

- Expose Node JS API to invoke and query the trade chaincode

### Environment

- Fabric images v1.4.3
- Fabric SDK v1.4.2

### Hyperledger Features Used

- Connection Profile
- Private data
- Channel Event Hub
- Fabric CA server replaces cryptogen

### Pre-requisite

_Bootstrap base network_  
Bootstrap the base network, according to [`./network/READMD.md`](network/README.md)  
This will build the 2-orgs/4-peers/4-CA topology. And, register/enrol:

- TLS CA admin
- Org1 & Org 2 Root CA admins
- Org1 & Org2 admins

_get familar with Admin-tool_  
See `packages/admin-tool/README.md`

### Getting Started
docker-compose up
./bootstrap.sh
docker-compose down/up
build chaincode (if chaincode was changed, need to remove pre-existing docker)
run create/install/instantiate/join channel (if new chaincode is build, it will take much longer time)
enrolAdmin
registerUser

### Clean up command
```shell script
docker volume prune
docker rm $(docker ps -qf "name=cli-org") -f
docker rm $(docker ps -aqf "name=eventstore") -f
docker rm $(docker ps -aqf "name=privatedata") -f
docker rmi $(docker images -q "dev-*")
```

### References

The source is refactored from below repo.  
[Sample Code - 1](https://github.com/kevin-hf/kevin-fabric-sdk-node)  
[IBM Sample Code - 2](https://github.com/PacktPublishing/Handson-Blockchain-Development-with-Hyperledger)
