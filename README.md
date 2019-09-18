### Overview

This package aims to implement basic commands for bootstrap Trade platform. This middleware fucntiona shall later enable
to develop more robust Blockchain-as-a-service platform.

Currently, it shall perform:

- Create a trade channel (or blockchain instance)
- Join peers of all the organizations to this channel
- Install the chaincode on every peer joined to the channel
- Instantiate the chaincode on this channel

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

_Step 0: Bootstrap base network_  
Bootstrap the base network, according to [`./network/READMD.md`](network/README.md)  
This will build the 2-orgs/4-peers/4-CA topology. And, register/enrol:

- TLS CA admin
- Org1 & Org 2 Root CA admins
- Org1 & Org2 admins

_Step 1: get familar with Admin-tool_  
See `packages/admin-tool/README.md`

### References

The source is refactored from below repo.  
[Sample Code - 1](https://github.com/kevin-hf/kevin-fabric-sdk-node)  
[IBM Sample Code - 2](https://github.com/PacktPublishing/Handson-Blockchain-Development-with-Hyperledger)
