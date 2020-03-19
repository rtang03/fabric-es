#!/usr/bin/env bash

# $1 - orderer (e.g. org0)
# $2 - org list (e.g. "org1 org2")

. /setup/setup.sh

getConfig $1
ORDERER_NAME=$NAME
ORDERER_PEER=$PEER
ORDERER_DOMAIN=$DOMAIN
ORDERER_CAPORT=$CAPORT

# Enroll tls-ca's Admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${ORDERER_NAME}MSP/tls/server/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${ORDERER_NAME}MSP/tls/admin

fabric-ca-client enroll -d -u https://tls-ca-admin:tls-ca-adminPW@0.0.0.0:${ORDERER_CAPORT}
for ORG in $2
do
  getConfig $ORG
  fabric-ca-client register -d --id.name ${PEER}.${DOMAIN} --id.secret ${PEER}.${DOMAIN}PW --id.type peer -u https://0.0.0.0:${ORDERER_CAPORT}
done
fabric-ca-client register -d --id.name ${ORDERER_PEER}.${ORDERER_DOMAIN} --id.secret ${ORDERER_PEER}.${ORDERER_DOMAIN}PW --id.type orderer -u https://0.0.0.0:${ORDERER_CAPORT}

# Peers
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
for ORG in $2
do
  getConfig $ORG

  # Copy certificate of the TLS CA for peer0
  mkdir -p /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/assets/tls-ca
  cp /var/artifacts/crypto-config/${ORDERER_NAME}MSP/tls/admin/msp/cacerts/0-0-0-0-${ORDERER_CAPORT}.pem /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/assets/tls-ca/tls-ca-cert.pem

  # Enroll peer0
  export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}
  export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/assets/tls-ca/tls-ca-cert.pem
  fabric-ca-client enroll -d -u https://${PEER}.${DOMAIN}:${PEER}.${DOMAIN}PW@0.0.0.0:${ORDERER_CAPORT} --enrollment.profile tls --csr.hosts ${PEER}-${ORG},127.0.0.1

  mv /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/keystore/* /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/tls-msp/keystore/key.pem
done

# Copy certificate of tls-ca for orderer0
mkdir -p /var/artifacts/crypto-config/${ORDERER_NAME}MSP/${ORDERER_PEER}.${ORDERER_DOMAIN}/assets/tls-ca
cp /var/artifacts/crypto-config/${ORDERER_NAME}MSP/tls/admin/msp/cacerts/0-0-0-0-${ORDERER_CAPORT}.pem /var/artifacts/crypto-config/${ORDERER_NAME}MSP/${ORDERER_PEER}.${ORDERER_DOMAIN}/assets/tls-ca/tls-ca-cert.pem

# Enroll for orderer
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${ORDERER_NAME}MSP/${ORDERER_PEER}.${ORDERER_DOMAIN}
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${ORDERER_NAME}MSP/${ORDERER_PEER}.${ORDERER_DOMAIN}/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://${ORDERER_PEER}.${ORDERER_DOMAIN}:${ORDERER_PEER}.${ORDERER_DOMAIN}PW@0.0.0.0:${ORDERER_CAPORT} --enrollment.profile tls --csr.hosts ${ORDERER_PEER}-${1},127.0.0.1

mv /var/artifacts/crypto-config/${ORDERER_NAME}MSP/${ORDERER_PEER}.${ORDERER_DOMAIN}/tls-msp/keystore/* /var/artifacts/crypto-config/${ORDERER_NAME}MSP/${ORDERER_PEER}.${ORDERER_DOMAIN}/tls-msp/keystore/key.pem
