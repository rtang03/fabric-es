## Overview

`lib-dev-net` is the development network, used for library development of below packages:

- authentication
- fabric-cqrs
- gw-node
- operator

It is 2org-2peers-2-ca network.

### _Step 1: Start network_

```shell script
# In first terminal: bootstrap Fabric-CA servers
# cd ~/deployments/lib-dev-net/config
docker-compose up
```

### _Step 2: Generate crypto material_

```shell script
# generate crypto-material
# create genesis.block
# open second terminal
# cd ~/deployments/lib-dev-net/scripts
./gen_certs.sh

# open third termainl
# the below step re-live orderers, with newly created certifcates
# `docker ps` should return a list of running orderers
# cd ~/deployments/lib-dev-net/config
docker-compose up -d
```

### _Step 3: Create genesis block_

```shell script
# back to second terminal: create genesis block file
# below command requires root password to proceed
# cd ~/deployments/lib-dev-net/scripts
./create_genesis.sh

# should return
# 2020-02-10 22:28:35.155 HKT [common.tools.configtxgen.localconfig] completeInitialization -> INFO 003 orderer type: etcdraft
# 2020-02-10 22:28:35.155 HKT [common.tools.configtxgen.localconfig] LoadTopLevel -> INFO 004 Loaded configuration: /Users/tangross/dev/2020/open-platform-dlt/deployments/gw-dev-net/config/configtx.yaml
# 2020-02-10 22:28:35.155 HKT [common.tools.configtxgen] doOutputAnchorPeersUpdate -> INFO 005 Generating anchor peer update
# 2020-02-10 22:28:35.156 HKT [common.tools.configtxgen] doOutputAnchorPeersUpdate -> INFO 006 Writing anchor peer update

# back to third terminal
docker-compose up -d

# should return, something like
# orderer3.hktfp.com         | 2020-02-11 02:50:17.282 UTC [orderer.consensus.etcdraft] serveRequest -> INFO 029 Raft leader changed: 0 -> 5 channel=ordererchannel node=4
# orderer4.hktfp.com         | 2020-02-11 02:50:17.283 UTC [orderer.consensus.etcdraft] serveRequest -> INFO 03e Start accepting requests as Raft leader at block [0] channel=ordererchannel node=5
```

### _Step 4: Join channel_

Note: there is error in updating anchor peers, and is commented out.

```shell script
# back to second terminal: join channel
# cd ~/deployments/gw-dev-net/scripts
./join_channel.sh

# should return
#2020-02-16 09:57:42.002 UTC [channelCmd] executeJoin -> INFO 002 Successfully submitted proposal to join channel
#2020-02-16 09:57:42.113 UTC [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
#Blockchain info: {"height":1,"currentBlockHash":"bcg6tSnnqrjIkyEmoYVrI7DOMWno6jLnoZV10xml1hQ="}
```

### _Step 5: Update collections.json_

Validate `~/packages/chaincode/collections.json` existence, and correctness. Or alternatively, copy from build material
to chaincode directory.

```shell script
# optionally step: build chaincode, if not yet build. It requires 'dist' directory, and package.json, proper collections.json
# run `yarn build` in ~/packages/chaincode directory

# cp ~/deployments/lib-dev-net/config/collections.json ~/packages/chaincode
```

### _Step 6: Install chaincode_

```shell script
# back to second terminal: install chaincode
# goto ~/deployments/gw-dev-net/scripts
./installcc.sh
```
