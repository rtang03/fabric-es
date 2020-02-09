```shell script
export CA_ENROLLMENT_ID_ADMIN=rca-etradeconnect-admin
export CA_ENROLLMENT_SECRET_ADMIN=rca-etradeconnect-adminPW
export CONNECTION_PROFILE=connection/gw-org-test-net.dev.yaml
export ORG_ADMIN_ID=admin-etradeconnect.net
export ORG_ADMIN_SECRET=Heym2rQK
export ORG_CA_URL=https://0.0.0.0:6054
export MSPID=EtcMSP
export NETWORK_LOCATION=../../deployments/gw-org-dev-net/artifacts/crypto-config
export ORDERER_TLSCA_CERT=$NETWORK_LOCATION/HktfpMSP/orderer0.hktfp.com/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem
export WALLET=assets/wallet
node ./dist/enrollAdmin.js
node ./dist/enrollCaAdmin.js

export CHANNEL_NAME=loanapp
export CHAINCODE_ID=eventstore
export CHAINCODE_ID_PRIVATEDATA=privatedata
export COLLECTION=etcPrivateDetails
export CHANNEL_HUB=peer0.etradeconnect.net
export CONNECTION_PROFILE=connection/gw-org-test-net.dev.yaml
export WALLET=assets/wallet
export ORG_ADMIN_ID=admin-etradeconnect.net
export ORGNAME=etradeconnect.net
export SERVICE_DOCUMENT_PORT=14013
export SERVICE_USER_PORT=14011
export SERVICE_LOAN_PORT=14012
export SERVICE_PRIVATE_PORT=14014

node ./dist/service-doc.js
node ./dist/service-user.js
node ./dist/service-loan.js
node ./dist/service-private.js

export REMOTE_ORG2_PORT=
export REMOTE_ORG2_NAME=
export REMOTE_ORG2_URI=
node ./dist/service-remote-org2.js

export REMOTE_ORG3_PORT=
export REMOTE_ORG3_NAME=
export REMOTE_ORG3_URI=
node ./dist/service-remote-org3.js

export ADMINISTRATOR_PORT=15011
export ORDERER_NAME=orderer0.hktfp.com
export ORDERER_TLSCA_CERT=../../deployments/gw-org-dev-net/artifacts/crypto-config/HktfpMSP/orderer0.hktfp.com/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem
export CA_ENROLLMENT_ID_ADMIN=rca-etradeconnect-admin
export CA_ENROLLMENT_SECRET_ADMIN=rca-etradeconnect-adminPW
export PEER_NAME=peer0.etradeconnect.net
node ./dist/service-admin.js

export GATEWAY_PORT=4001
export GATEWAY_HOST=localhost
export AUTHORIZATION_SERVER_URI=http://localhost:3301/oauth/authenticate
node ./dist/start-gateway.js
```
