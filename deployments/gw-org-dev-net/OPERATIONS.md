## PART A: Instructions for building auth-server image

### _Step 1: Validate build material for your organization of a given deployment_

Below example is based on _gw-org-dev-net_ . All build material is located at `~/deployments/gw-org-dev-net/build.gw-org[X]`.

- Validate `.env.prod` content, for default environment variables, for gw-org.
- Validate `.env.auth-server.prod` content, for default environment variables, for auth-server.
- Validate `connection-all.prod.yaml`, connection profile for entire network.
- Validate `connection-org[X].prod.yaml`, connection profile per org.

### _Step 2: Build context_

```shell script
# tsc
yarn build:authentication

# send build context to .build directory
yarn package-auth-only
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
# Using localhost
# besides, the post 5432 will conflict with postgres defined boilerplated docker-compose.yaml
# need to change port and name
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

See sample `~/deployments/gw-org-dev-net/config/docker-compose.yaml`. The boilerplated
`docker-compose.yaml` does not define auth-server images, because _authentication_ package is under
development, and immature to dockerize.

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
# because of espresso/auth-server and postgres run on
# different docker networks. It will work only if postgres run on assessible network, e.g.
# standalone installation.
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
# tsc
yarn build:lib
yarn build:gw-org1

# send build context to .build directory
yarn package-org1
```

```shell script
# build it locally
DOCKER_BUILD=1 docker build --no-cache -f ./gw-org1.dockerfile -t espresso/gw-org1:1.0 .

docker run \
-e AUTHORIZATION_SERVER_URI=http://localhost:3900/oauth/authenticate \
-e CA_ENROLLMENT_ID_ADMIN=rca-etradeconnect-admin \
-e CA_ENROLLMENT_SECRET_ADMIN=rca-etradeconnect-adminPW \
-e CONNECTION_PROFILE=/home/app/packages/gw-org1/connection/gw-org-test-net.dev.yaml \
-e COLLECTION=etcPrivateDetails \
-e ORG_ADMIN_ID=admin-etradeconnect.net \
-e ORG_ADMIN_SECRET=Heym2rQK \
-e ORG_CA_URL=https://0.0.0.0:6054 \
-e NETWORK_LOCATION=/home/app/deployments/gw-org-dev-net/artifacts/crypto-config \
-e ORDERER_NAME=orderer0.hktfp.com \
-e ORDERER_TLSCA_CERT=/home/app/deployments/gw-org-dev-net/artifacts/crypto-config/HktfpMSP/orderer0.hktfp.com/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem \
-e PEER_NAME=peer0.etradeconnect.net \
-e WALLET=assets/wallet \
-e MSPID=EtcMSP \
-e GATEWAY_HOST=localhost \
-v `pwd`/deployments/gw-org-dev-net/artifacts/crypto-config/:/home/app/deployments/gw-org-dev-net/artifacts/crypto-config \
-v `pwd`/packages/gw-org1/assets/:/home/app/packages/gw-org1/assets \
-v `pwd`/packages/gw-org1/connection/:/home/app/packages/gw-org1/connection \
-v `pwd`/packages/gw-org1/logs/:/home/app/packages/gw-org1/logs \
--name gw-org1 \
-p 4000:4001 espresso/gw-org1:1.0
```


https://medium.com/@adriendesbiaux/node-js-pm2-docker-docker-compose-devops-907dedd2b69a
https://pm2.keymetrics.io/docs/usage/application-declaration/

docker-compose -f docker-compose.fabric_only.yaml up


export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp
peer channel create -c loanapp -f /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/channel.tx -o orderer0.hktfp.com:7050 \
    --outputBlock /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/loanapp.block \
    --tls --cafile /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem
 

export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/EtcMSP/admin/msp
export CORE_PEER_ADDRESS=peer0.etradeconnect.net:7051
peer channel join -b /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/loanapp.block
export CORE_PEER_ADDRESS=peer1.etradeconnect.net:7151
peer channel join -b /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/loanapp.block
   
export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/PbctfpMSP/admin/msp
export CORE_PEER_ADDRESS=peer0.pbctfp.net:7251
peer channel join -b /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/assets/loanapp.block
export CORE_PEER_ADDRESS=peer1.pbctfp.net:7351
peer channel join -b /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/assets/loanapp.block

./installcc.sh
