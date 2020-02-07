
# Hyperledger Fabric 4 CAs Setup

`<Reference>` : <https://hyperledger-fabric-ca.readthedocs.io/en/latest/operations_guide.html>

Prerequsites: docker and docker-compose

***

## Topology

![Logical Topology](config/logical_topology_raft.png)

***

## Setup Fabric Network

1. Before starting the network, ensure the binary directory is set correctly. Update the "_BIN_DIR" variable in [scripts/common.sh](scripts/common.sh). 
**Note:** Make sure the binary version is same as the fabric image version.

```console
_BIN_DIR="/Users/xxx/Desktop/workspace/fabric-samples/bin"
```

2. To start the network, run the start command.
(Note: It may asks you for the sudo password to perform the copy and cleanup jobs)

```shell script
./start.sh
```

```console
2019-12-04 09:15:43.664 UTC [msp.identity] Sign -> DEBU 03c Sign: plaintext: 0ACE080A5C08031A0C08BFF29DEF0510...6E496E666F0A096D796368616E6E656C
2019-12-04 09:15:43.664 UTC [msp.identity] Sign -> DEBU 03d Sign: digest: FF6F1ED2B403296BADD42899EC8248CF229BFDAD41AD9A899BF22C28BE095A4A
Blockchain info: {"height":1,"currentBlockHash":"/6tan/EbdYXfSSDV2DYcEUf8IdfEBWbB4vpNkmQP4lc="}
The network is started.
```

***

## Install and instaniate chaincode

```shell script
# Note: Yarn install is required for the FIRST TIME only
cd ../../packages/chaincode
yarn install

# Note: You need to ENSURE collecions.json is set correctly
cd ../../deployments/boilerplate
./installcc.sh
```

***

## Clean Up

If everything is good, we can clean up the environment. :tada::tada:

```shell script
./cleanup.sh
```

***

## Note

If you use the connection profiles, ENSURE the paths in connection profiles are set correctly. Precisely, replace the string **"boilerplate"** with your network folder.
