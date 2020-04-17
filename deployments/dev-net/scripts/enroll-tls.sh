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

for ODR in ${ORDERER_PEER}; do
  fabric-ca-client register -d --id.name ${ODR}.${ORDERER_DOMAIN} --id.secret ${ODR}.${ORDERER_DOMAIN}PW --id.type orderer -u https://0.0.0.0:${ORDERER_CAPORT}
done

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

for ODR in ${ORDERER_PEER}; do
  # Copy certificate of tls-ca for orderer
  mkdir -p /var/artifacts/crypto-config/${ORDERER_NAME}MSP/${ODR}.${ORDERER_DOMAIN}/assets/tls-ca
  cp /var/artifacts/crypto-config/${ORDERER_NAME}MSP/tls/admin/msp/cacerts/0-0-0-0-${ORDERER_CAPORT}.pem /var/artifacts/crypto-config/${ORDERER_NAME}MSP/${ODR}.${ORDERER_DOMAIN}/assets/tls-ca/tls-ca-cert.pem

  # Enroll for orderer
  export FABRIC_CA_CLIENT_MSPDIR=tls-msp
  export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${ORDERER_NAME}MSP/${ODR}.${ORDERER_DOMAIN}
  export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${ORDERER_NAME}MSP/${ODR}.${ORDERER_DOMAIN}/assets/tls-ca/tls-ca-cert.pem
  fabric-ca-client enroll -d -u https://${ODR}.${ORDERER_DOMAIN}:${ODR}.${ORDERER_DOMAIN}PW@0.0.0.0:${ORDERER_CAPORT} --enrollment.profile tls --csr.hosts ${ODR}-${1},127.0.0.1

  mv /var/artifacts/crypto-config/${ORDERER_NAME}MSP/${ODR}.${ORDERER_DOMAIN}/tls-msp/keystore/* /var/artifacts/crypto-config/${ORDERER_NAME}MSP/${ODR}.${ORDERER_DOMAIN}/tls-msp/keystore/key.pem
done
