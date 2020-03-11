## Overview

(I) `dev-net` is the development network, used for docker image building and testing of below packages:

- auth-server
- gw-org1
- gw-org2

(II) `~/packages/tester` will reply on `gw-dev-net/scripts` to prepare the crypto-materials. Therefore,
in case scripts are modify, it may negatively impact the integration test runs.

## PART C: Instructions for Launch Network

### _Step 0: Cleanup_

Optionally, if need to cleanup, (a) pre-existing persisted network, and/or organizational assets, you need to remove below directory.

- `.volume/auth-server1/logs`: auth-server log files
- `.volume/auth-server2/logs`: auth-server log files
- `.volume/gw-org1`: localized certificates and wallets, logs, connection profile in gw-org1
- `.volume/gw-org2`: localized certificates and wallets, logs, connection profile in gw-org2
- `.volume/production`: persisted Fabric network's correspondsing `/var/hyperledger/production`
- `.volume/artifacts/crypto-config`: entire network crypto material
- `.volume/artifacts/postgres01`: postgres data for org1
- `.volume/artifacts/postgres02`: postgres data for org2

### _Step 1: Start network_

```shell script
# In first terminal: bootstrap Fabric-CA servers
# cd ~/deployments/gw-dev-net/config
docker-compose -f docker-compose.fabric_only.yaml up

# Note: Wait the postgres init process done as below, before continue
# postgres01                 | 2020-02-10 14:25:54.022 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
# postgres01                 | 2020-02-10 14:25:54.142 UTC [65] LOG:  database system was shut down at 2020-02-10 14:25:53 UTC
# postgres01                 | 2020-02-10 14:25:54.199 UTC [1] LOG:  database system is ready to accept connections
```

### _Step 2: Generate crypto material_

```shell script
# generate crypto-material
# create genesis.block
# open second terminal
# cd ~/deployments/gw-dev-net/scripts
./gen_certs.sh

# open third termainl
# the below step re-live orderers, with newly created certifcates
# `docker ps` should return a list of running orderers
# cd ~/deployments/gw-dev-net/config
docker-compose -f docker-compose.fabric_only.yaml up -d
```

### _Step 3: Create genesis block_

```shell script
# back to second terminal: create genesis block file
# below command requires root password to proceed
# cd ~/deployments/gw-dev-net/scripts
./create_genesis.sh

# should return
# 2020-02-10 22:28:35.155 HKT [common.tools.configtxgen.localconfig] completeInitialization -> INFO 003 orderer type: etcdraft
# 2020-02-10 22:28:35.155 HKT [common.tools.configtxgen.localconfig] LoadTopLevel -> INFO 004 Loaded configuration: /Users/tangross/dev/2020/open-platform-dlt/deployments/gw-dev-net/config/configtx.yaml
# 2020-02-10 22:28:35.155 HKT [common.tools.configtxgen] doOutputAnchorPeersUpdate -> INFO 005 Generating anchor peer update
# 2020-02-10 22:28:35.156 HKT [common.tools.configtxgen] doOutputAnchorPeersUpdate -> INFO 006 Writing anchor peer update

# back to third terminal
docker-compose -f docker-compose.fabric_only.yaml up -d

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
# Blockchain info: {"height":1,"currentBlockHash":"dfPFqoTXTdWQcklu2WNUHfnpECemGbc7wydFDo5lIrY="}
# 2020-02-10 14:30:35.108 UTC [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
# 2020-02-10 14:30:35.139 UTC [channelCmd] update -> INFO 002 Successfully submitted channel update
```

### _Step 5: Update collections.json_

Validate `~/packages/chaincode/collections.json` existence, and correctness. Or alternatively, copy from build material
to chaincode directory.

```shell script
# optionally step: build chaincode, if not yet build. It requires 'dist' directory, and package.json, proper collections.json
# run `yarn build` in ~/packages/chaincode directory

# cp ~/deployments/gw-dev-net/build.gw-org1/collections.json ~/packages/chaincode/collections.json
```

### _Step 6: Install chaincode_

```shell script
# back to second terminal: install chaincode
# goto ~/deployments/gw-dev-net/scripts
./installcc.sh
```

### _Step 7: Swtich network_

In step 1 to 6, it acts on `docker-compose.fabric_only.yaml`, it is used to bootstrap the base network, without
`gw-org1`, `gw-org2` images. Shut it down, and switch to regular network.

```shell script
# back to third terminal
# cd ~/deployments/gw-dev-net/config
docker-compose -f docker-compose.fabric_only.yaml down

# in the second terminal
# copy org's connection profiles to the mounted volume
# cd ~/deployments/gw-dev-net
mkdir -p .volume/gw-org1/assets
mkdir -p .volume/gw-org2/assets
cp ./build.gw-org1/connection-org1.prod.yaml .volume/gw-org1/assets/connection.yaml
cp ./build.gw-org2/connection-org2.prod.yaml .volume/gw-org2/assets/connection.yaml

# Above steps install chaincode, and network, and can restart with regular network
# back to first terminal
# cd ~/deployments/gw-dev-net/config
docker-compose up

# at the end, should return
#gw-org2                    | [PM2] App [user] launched (1 instances)
#gw-org2                    | ┌─────┬─────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
#gw-org2                    | │ id  │ name        │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
#gw-org2                    | ├─────┼─────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
#gw-org2                    | │ 0   │ admin       │ default     │ 1.0.0   │ cluster │ 109      │ 22s    │ 0    │ online    │ 0%       │ 109.4mb  │ node     │ disabled │
#gw-org2                    | │ 1   │ doc         │ default     │ 1.0.0   │ cluster │ 115      │ 22s    │ 0    │ online    │ 0%       │ 110.9mb  │ node     │ disabled │
#gw-org2                    | │ 2   │ loan        │ default     │ 1.0.0   │ cluster │ 139      │ 17s    │ 0    │ online    │ 0%       │ 112.3mb  │ node     │ disabled │
#gw-org2                    | │ 3   │ prv-dtls    │ default     │ 1.0.0   │ cluster │ 154      │ 13s    │ 0    │ online    │ 0%       │ 111.6mb  │ node     │ disabled │
#gw-org2                    | │ 4   │ rmt-ctnt    │ default     │ 1.0.0   │ cluster │ 164      │ 10s    │ 0    │ online    │ 0%       │ 104.0mb  │ node     │ disabled │
#gw-org2                    | │ 5   │ user        │ default     │ 1.0.0   │ cluster │ 184      │ 5s     │ 0    │ online    │ 0%       │ 114.0mb  │ node     │ disabled │
#gw-org2                    | └─────┴─────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
#gw-org1                    | [WARN] PM2 Daemon is already running
#gw-org2                    | $ pm2-runtime --delay 10 --only "gw" processes.yaml
#gw-org2                    | [WARN] PM2 Daemon is already running
#gw-org1                    | 🚀 Server at http://0.0.0.0:4001/graphql
#gw-org1                    | {"message":"🚀 Server at http://0.0.0.0:4001/graphql","level":"info","label":"app.js","timestamp":"2020-02-13T15:02:35.029Z"}
#gw-org1                    | [INFO] Thu Feb 13 2020 23:02:34 GMT+0800 (HKT) apollo-gateway: Gateway successfully loaded schema.
#gw-org1                    | 	* Mode: unmanaged
#gw-org2                    | 🚀 Server at http://0.0.0.0:4002/graphql
#gw-org2                    | {"message":"🚀 Server at http://0.0.0.0:4002/graphql","level":"info","label":"app.js","timestamp":"2020-02-13T15:02:35.993Z"}
#gw-org2                    | [INFO] Thu Feb 13 2020 23:02:35 GMT+0800 (HKT) apollo-gateway: Gateway successfully loaded schema.
#gw-org2                    | 	* Mode: unmanaged

```

Note that, do not try combine both networks, because the postgres01 database require init step, and will take time.

### _Step 8: Network ready_

- Goto gw-org1 `http://localhost:4011/graphql`
- Goto auth-server1, with either `http://localhost:3901` or `http://localhost:3901/graphql`
- Goto gw-org2 `http://localhost:4012/graphql`
- Goto auth-server2, with either `http://localhost:3902` or `http://localhost:3902/graphql`

### Useful Commands

```shell script
docker rm -f \$(docker ps -aq -f status=exited)

sudo lsof -P -sTCP:LISTEN -i TCP -a -p 5432
sudo lsof -i :5432
```

### References

[Node, pm2 dockers devops](https://medium.com/@adriendesbiaux/node-js-pm2-docker-docker-compose-devops-907dedd2b69a)
[pm2 documentation](https://pm2.keymetrics.io/docs/usage/application-declaration/)

### Todo: implement trigger, so that cli can run reconcile, cleanup action

TBD
https://pm2.keymetrics.io/docs/usage/process-actions/
pm2 trigger <application-name> <action-name> [parameter]
