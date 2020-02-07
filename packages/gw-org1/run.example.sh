#!/bin/bash
export ORG_CA_URL=https://0.0.0.0:6054
export ORG_ADMIN_ID=admin-etradeconnect.net
export ORG_ADMIN_SECRET=Heym2rQK
export MSPID=EtcMSP
export NETWORK_LOCATION=../../deployments/gw-org-dev-net/artifacts/crypto-config
export ORDERER_TLSCA_CERT=$NETWORK_LOCATION/HktfpMSP/orderer0.hktfp.com/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem
export WALLET=assets/wallet
export CONNECTION_PROFILE=connection/gw-org-test-net.dev.yaml
yarn enrollAdmin
yarn enrollCaAdmin
