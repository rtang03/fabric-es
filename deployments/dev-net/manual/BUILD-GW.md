## PART B: Instructions for GW-ORG1 and ORG2

### _Step 1: Validate .env.prod_

Validate `.env.prod` content, for default environment variables.

### _Step 2: Build context_

```shell script
# send build context to .build directory
yarn build:gw-dev-net:org1

# send build context to .build directory
yarn build:gw-dev-net:org2
```

```shell script
# build org1 image
DOCKER_BUILD=1 docker build --no-cache -f ./gw-org1.dockerfile -t espresso/gw-org1:1.0 .

# build org2 image
DOCKER_BUILD=1 docker build --no-cache -f ./gw-org2.dockerfile -t espresso/gw-org2:1.0 .
```

If running docker image, may launch `~/deployments/gw-dev-net/config/docker-compose up`

```yaml
gw-org1:
  image: espresso/gw-org1:1.0
  container_name: gw-org1
  environment:
    - AUTHORIZATION_SERVER_URI=http://auth-server/oauth/authenticate
    - CA_ENROLLMENT_ID_ADMIN=rca-etradeconnect-admin
    - CA_ENROLLMENT_SECRET_ADMIN=rca-etradeconnect-adminPW
    - CONNECTION_PROFILE=/home/app/packages/gw-org1/assets/connection.yaml
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
