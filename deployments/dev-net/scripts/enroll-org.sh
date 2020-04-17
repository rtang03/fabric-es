#!/bin/bash

# $1 - org (e.g. org1)

. /setup/setup.sh

getConfig $1

# Copy TLS Cert
mkdir -p /var/artifacts/crypto-config/${NAME}MSP/ca/crypto
cp /var/artifacts/crypto-config/${NAME}MSP/ca/server/ca-cert.pem /var/artifacts/crypto-config/${NAME}MSP/ca/crypto

# Register and Enroll
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${NAME}MSP/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${NAME}MSP/ca/admin
fabric-ca-client enroll -d -u https://rca-${1}-admin:rca-${1}-adminPW@0.0.0.0:${CAPORT}
fabric-ca-client register -d --id.name ${PEER}.${DOMAIN} --id.secret ${PEER}.${DOMAIN}PW --id.type peer -u https://0.0.0.0:${CAPORT}
fabric-ca-client register -d --id.name admin-${DOMAIN} --id.secret admin-${DOMAIN}PW --id.type admin --id.attrs "hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://0.0.0.0:${CAPORT}

# Copy Trusted Root Cert to peer0
mkdir -p /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/assets/ca
cp /var/artifacts/crypto-config/${NAME}MSP/ca/admin/msp/cacerts/0-0-0-0-${CAPORT}.pem /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/assets/ca/${DOMAIN}-ca-cert.pem

# Enroll peer0
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/assets/ca/${DOMAIN}-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}
fabric-ca-client enroll -d -u https://${PEER}.${DOMAIN}:${PEER}.${DOMAIN}PW@0.0.0.0:${CAPORT}

# Enroll Admin
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${NAME}MSP/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/assets/ca/${DOMAIN}-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin-${DOMAIN}:admin-${DOMAIN}PW@0.0.0.0:${CAPORT}

# Copy admin cert to peer0
mkdir -p /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/msp/admincerts
cp /var/artifacts/crypto-config/${NAME}MSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/msp/admincerts/${DOMAIN}-admin-cert.pem

# Rename admin key
mv /var/artifacts/crypto-config/${NAME}MSP/admin/msp/keystore/* /var/artifacts/crypto-config/${NAME}MSP/admin/msp/keystore/key.pem
