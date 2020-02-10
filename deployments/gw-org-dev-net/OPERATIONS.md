## PART A: Instructions for building auth-server image

### _Step 1: Validate build material for your organization of a given deployment_

Below example is based on _gw-org-dev-net_ . All build material is located at `~/deployments/gw-org-dev-net/build.gw-org[X]`.

- Validate `.env.prod` content, for default environment variables, for gw-org.
- Validate `.env.auth-server.prod` content, for default environment variables, for auth-server.
- Validate `connection-org[X].prod.yaml`, connection profile per org.

### _Step 2: Build context_

```shell script
# send the build content to ./build directory
yarn build:auth
```

### _Step 3: Build images_

```shell script
# build it locally
# go to project root, e.g. cd ~
# or alternatively, pick namespace hktfp5/auth-server
DOCKER_BUILD=1 docker build --no-cache -f ./auth-server.dockerfile -t espresso/auth-server:1.0 .
```

### _Step 4: Launch Postgres_

_Option 1: local machine Setup: standalone postgres_

```shell script
# Using localhost, can be used for local development.
# However, the port 5432 will conflict with postgres defined boilerplated docker-compose.yaml
# If using boilerplated docker-compose up, you should not run this command.
docker run -d \
  -e POSTGRES_PASSWORD=docker \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=postgres \
  -v ./packages/authentication/.volume:/var/lib/postgresql/data \
  --name postgres-dev -p 5432:5432 postgres

# OR directly re-use postgres01 defined in the docker-compose.yaml
# no setting is required
```

_Option 2: local machine Setup: embeded in docker-compose_

See sample `~/deployments/gw-org-dev-net/config/docker-compose.yaml`. Intentionally, the boilerplated
`docker-compose.yaml` includes auth-server images. Other boilerplated network may not includes `auth-server`,
and therefore, need to add it manually.

```yaml
auth-server:
  image: espresso/auth-server:1.0
  container_name: auth-server
  environment:
    - TYPEORM_HOST=postgres01
    - TYPEORM_PORT=5432
    - TYPEORM_USERNAME=postgres
    - TYPEORM_PASSWORD=docker
    - TYPEORM_DATABASE=auth_db
  ports:
    - 3900:8080
  depends_on:
    - postgres01
  networks:
    - openplatform
```

Note hat _depends_on_ is essential to wait _postgres01_ to start.

_Option 3: If using Google Cloud Setup_

- Goto (require login) [Google Cloud SQL/fdi-test-net](https://console.cloud.google.com/sql/instances/fdi-test-net/connections?cloudshell=false&project=fdi-test-net)
- Under Connectivity
- Under Public IP
- Whitelist your IP

Note: currently, I have create only one database `auth_db` instance

```shell script
# Using Google Cloud SQL
docker run -e TYPEORM_HOST=35.239.77.51 \
  -e TYPEORM_USERNAME=postgres \
  -e TYPEORM_PASSWORD=docker \
  -e TYPEORM_LOGGING=true \
  -e TYPEORM_DATABASE=auth_db \
  --name auth-server \
  -p 3900:8080 espresso/auth-server:1.0
```

### _Step 5: optionally, create auth_db, if using local machine_

```shell script
# sh to the running postgres container
docker exec -it postgres01 bash

# Create auth_db
su - postgres
psql
DROP DATABASE IF EXISTS auth_db;
CREATE DATABASE auth_db;
\l
\q
exit
```

### _Step 6: run auth server_

```shell script
# (a) Standalone execution
# This command does not work when postgres01 is embedded in docker-compose,
# because of espresso/auth-server and postgres run on ifferent docker networks.
# It will work only if postgres run on assessible network, e.g. standalone installation.
#docker run \
#  -e TYPEORM_HOST=localhost \
#  -e TYPEORM_PORT=5432 \
#  -e TYPEORM_USERNAME=postgres \
#  -e TYPEORM_PASSWORD=docker \
#  -e TYPEORM_DATABASE=auth_db \
#  --name auth-server \
#  -p 3900:8080 espresso/auth-server:1.0

# (b) embedded approach
# see example ~/deployments/gw-org-dev-net/config/docker-compose.yaml
```

open `http://localhost:3900/graphql`

or display running status with below pm2 command.

```shell script
# display running process
docker exec auth-server pm2 list

# should return:
┌─────┬────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name           │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ auth-server    │ default     │ 1.0.0   │ cluster │ 17       │ 70s    │ 0    │ online    │ 0%       │ 68.4mb   │ node     │ disabled │
└─────┴────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘


# display logs
docker exec auth-server pm2 logs
```

## PART B: Instructions for GW-ORG1

### _Step 1: Validate .env.prod_

Validate `.env.prod` content, for default environment variables.

### _Step 2: Build context_

```shell script
# send build context to .build directory
yarn build:gw-org-dev-net:org1
```

```shell script
# build it locally
DOCKER_BUILD=1 docker build --no-cache -f ./gw-org1.dockerfile -t espresso/gw-org1:1.0 .
```

If running docker image, may launch `~/deployments/gw-org-dev-net/config/docker-compose up`

```yaml
gw-org1:
  image: espresso/gw-org1:1.0
  container_name: gw-org1
  environment:
    - AUTHORIZATION_SERVER_URI=http://auth-server/oauth/authenticate
    - CA_ENROLLMENT_ID_ADMIN=rca-etradeconnect-admin
    - CA_ENROLLMENT_SECRET_ADMIN=rca-etradeconnect-adminPW
    - CONNECTION_PROFILE=/home/app/packages/gw-org1/connection.yaml
    - COLLECTION=etcPrivateDetails
    - ORG_ADMIN_ID=admin-etradeconnect.net
    - ORG_ADMIN_SECRET=Heym2rQK
    - ORG_CA_URL=https://rca.etradeconnect.net:6054
    - NETWORK_LOCATION=/var/artifacts/crypto-config
    - ORDERER_NAME=orderer0.hktfp.com
    - ORDERER_TLSCA_CERT=/var/artifacts/crypto-config/HktfpMSP/orderer0.hktfp.com/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem
    - PEER_NAME=peer0.etradeconnect.net
    - WALLET=assets/wallet
    - MSPID=EtcMSP
    - GATEWAY_HOST=localhost
  working_dir: /home/app/packages/gw-org1
  ports:
    - 4000:4001
  networks:
    - openplatform
  depends_on:
    - auth-server
    - orderer0.hktfp.com
    - peer0.etradeconnect.net
  volumes:
    - ../.volume/gw-org1/assets/:/home/app/packages/gw-org1/assets/
    - ../.volume/gw-org1/logs/:/home/app/packages/gw-org1/logs/
    - ../artifacts/crypto-config/:/var/artifacts/crypto-config/
```

## PART C: Instructions for Launch Network

### _Step 0: Cleanup_

Optionally, if need to cleanup, (a) pre-existing persisted network, and/or organizational assets, you need to remove below directory.

- `.volume/gw-org1`: localized certificates and wallets, logs in gw-org1
- `.volume/gw-org2`: localized certificates and wallets, logs in gw-org2
- `.volume/production`: persisted Fabric network's correspondsing `/var/hyperledger/production`
- `.volume/artifacts/crypto-config`: entire network,,'s crypto material
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
# 2020-02-10 22:28:35.155 HKT [common.tools.configtxgen.localconfig] LoadTopLevel -> INFO 004 Loaded configuration: /Users/tangross/dev/2020/open-platform-dlt/deployments/gw-org-dev-net/config/configtx.yaml
# 2020-02-10 22:28:35.155 HKT [common.tools.configtxgen] doOutputAnchorPeersUpdate -> INFO 005 Generating anchor peer update
# 2020-02-10 22:28:35.156 HKT [common.tools.configtxgen] doOutputAnchorPeersUpdate -> INFO 006 Writing anchor peer update

# back to third terminal
docker-compose -f docker-compose.fabric_only.yaml up -d
```

### _Step 4: Join channel and update anchor peers_

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
# cp ~/deployments/gw-org-dev-net/build.gw-org1 ~/packages/chaincode/collections.json
```

### _Step 6: Install chaincode_

```shell script
# back to second terminal: install chaincode
# goto ~/deployments/gw-dev-net/
cd ..
./installcc.sh
```

### _Step 7: Swtich network_

In step 1 to 6, it acts on `docker-compose.fabric_only.yaml`, it is used to bootstrap the base network, without
`gw-org1`, `gw-org2` images. Shut it down, and switch to regular network.

```shell script
# back to third terminal
# cd ~/deployments/gw-dev-net/config
docker-compose -f docker-compose.fabric_only.yaml down

# Above steps install chaincode, and network, and can restart with regular network
# cd ~/deployments/gw-dev-net/config
docker-compose up
```

Note that, do not try combine both networks, because the postgres01 database require init step, and will take time. 

### _Step 8: Network ready_

- Goto gw-org `http://localhost:4000/graphql`
- Got auth-server, with either `http://localhost:3900` or `http://localhost:3900/graphql`

### Useful Commands

```shell script
docker rm -f \$(docker ps -aq -f status=exited)

sudo lsof -P -sTCP:LISTEN -i TCP -a -p 5432
```

### References

[Node, pm2 dockers devops](https://medium.com/@adriendesbiaux/node-js-pm2-docker-docker-compose-devops-907dedd2b69a)
[pm2 documentation](https://pm2.keymetrics.io/docs/usage/application-declaration/)
