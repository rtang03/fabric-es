#!/usr/bin/env bash

# $1 - orderer (e.g. org0)

. /setup/setup.sh

getConfig $1
PORT=5053

# Copy TLS Cert
mkdir -p /var/artifacts/crypto-config/${NAME}MSP/ca/crypto
cp /var/artifacts/crypto-config/${NAME}MSP/ca/server/ca-cert.pem /var/artifacts/crypto-config/${NAME}MSP/ca/crypto

# Enroll Orderer Org's CA Admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${NAME}MSP/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${NAME}MSP/ca/admin

fabric-ca-client enroll -d -u https://rca-${1}-admin:rca-${1}-adminPW@0.0.0.0:${PORT}
fabric-ca-client register -d --id.name ${PEER}.${DOMAIN} --id.secret ${PEER}.${DOMAIN}PW --id.type orderer -u https://0.0.0.0:${PORT}
fabric-ca-client register -d --id.name admin-${DOMAIN} --id.secret admin-${DOMAIN}PW --id.type admin --id.attrs "hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://0.0.0.0:${PORT}

fabric-ca-client register -d --id.name orderer1.${DOMAIN} --id.secret orderer1.${DOMAIN}PW --id.type orderer -u https://0.0.0.0:${PORT}
fabric-ca-client register -d --id.name orderer2.${DOMAIN} --id.secret orderer2.${DOMAIN}PW --id.type orderer -u https://0.0.0.0:${PORT}
fabric-ca-client register -d --id.name orderer3.${DOMAIN} --id.secret orderer3.${DOMAIN}PW --id.type orderer -u https://0.0.0.0:${PORT}
fabric-ca-client register -d --id.name orderer4.${DOMAIN} --id.secret orderer4.${DOMAIN}PW --id.type orderer -u https://0.0.0.0:${PORT}

# Copy Trusted Root Cert of orderer0
mkdir -p /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/assets/ca
cp /var/artifacts/crypto-config/${NAME}MSP/ca/admin/msp/cacerts/0-0-0-0-${PORT}.pem /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/assets/ca/${DOMAIN}-ca-cert.pem

mkdir -p /var/artifacts/crypto-config/${NAME}MSP/orderer1.${DOMAIN}/assets/ca
cp /var/artifacts/crypto-config/${NAME}MSP/ca/admin/msp/cacerts/0-0-0-0-${PORT}.pem /var/artifacts/crypto-config/${NAME}MSP/orderer1.${DOMAIN}/assets/ca/${DOMAIN}-ca-cert.pem
mkdir -p /var/artifacts/crypto-config/${NAME}MSP/orderer2.${DOMAIN}/assets/ca
cp /var/artifacts/crypto-config/${NAME}MSP/ca/admin/msp/cacerts/0-0-0-0-${PORT}.pem /var/artifacts/crypto-config/${NAME}MSP/orderer2.${DOMAIN}/assets/ca/${DOMAIN}-ca-cert.pem
mkdir -p /var/artifacts/crypto-config/${NAME}MSP/orderer3.${DOMAIN}/assets/ca
cp /var/artifacts/crypto-config/${NAME}MSP/ca/admin/msp/cacerts/0-0-0-0-${PORT}.pem /var/artifacts/crypto-config/${NAME}MSP/orderer3.${DOMAIN}/assets/ca/${DOMAIN}-ca-cert.pem
mkdir -p /var/artifacts/crypto-config/${NAME}MSP/orderer4.${DOMAIN}/assets/ca
cp /var/artifacts/crypto-config/${NAME}MSP/ca/admin/msp/cacerts/0-0-0-0-${PORT}.pem /var/artifacts/crypto-config/${NAME}MSP/orderer4.${DOMAIN}/assets/ca/${DOMAIN}-ca-cert.pem

# Enroll orderer0
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/assets/ca/${DOMAIN}-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}
fabric-ca-client enroll -d -u https://${PEER}.${DOMAIN}:${PEER}.${DOMAIN}PW@0.0.0.0:${PORT}

export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${NAME}MSP/orderer1.${DOMAIN}/assets/ca/${DOMAIN}-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${NAME}MSP/orderer1.${DOMAIN}
fabric-ca-client enroll -d -u https://orderer1.${DOMAIN}:orderer1.${DOMAIN}PW@0.0.0.0:${PORT}

export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${NAME}MSP/orderer2.${DOMAIN}/assets/ca/${DOMAIN}-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${NAME}MSP/orderer2.${DOMAIN}
fabric-ca-client enroll -d -u https://orderer2.${DOMAIN}:orderer2.${DOMAIN}PW@0.0.0.0:${PORT}

export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${NAME}MSP/orderer3.${DOMAIN}/assets/ca/${DOMAIN}-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${NAME}MSP/orderer3.${DOMAIN}
fabric-ca-client enroll -d -u https://orderer3.${DOMAIN}:orderer3.${DOMAIN}PW@0.0.0.0:${PORT}

export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${NAME}MSP/orderer4.${DOMAIN}/assets/ca/${DOMAIN}-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${NAME}MSP/orderer4.${DOMAIN}
fabric-ca-client enroll -d -u https://orderer4.${DOMAIN}:orderer4.${DOMAIN}PW@0.0.0.0:${PORT}

# Enroll orderer's Admin
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${NAME}MSP/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/assets/ca/${DOMAIN}-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin-${DOMAIN}:admin-${DOMAIN}PW@0.0.0.0:${PORT}

# Copy admin cert to the orderer0
mkdir -p /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/msp/admincerts
cp /var/artifacts/crypto-config/${NAME}MSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/${NAME}MSP/${PEER}.${DOMAIN}/msp/admincerts/${DOMAIN}-admin-cert.pem

mkdir -p /var/artifacts/crypto-config/${NAME}MSP/orderer1.${DOMAIN}/msp/admincerts
cp /var/artifacts/crypto-config/${NAME}MSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/${NAME}MSP/orderer1.${DOMAIN}/msp/admincerts/${DOMAIN}-admin-cert.pem

mkdir -p /var/artifacts/crypto-config/${NAME}MSP/orderer2.${DOMAIN}/msp/admincerts
cp /var/artifacts/crypto-config/${NAME}MSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/${NAME}MSP/orderer2.${DOMAIN}/msp/admincerts/${DOMAIN}-admin-cert.pem

mkdir -p /var/artifacts/crypto-config/${NAME}MSP/orderer3.${DOMAIN}/msp/admincerts
cp /var/artifacts/crypto-config/${NAME}MSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/${NAME}MSP/orderer3.${DOMAIN}/msp/admincerts/${DOMAIN}-admin-cert.pem

mkdir -p /var/artifacts/crypto-config/${NAME}MSP/orderer4.${DOMAIN}/msp/admincerts
cp /var/artifacts/crypto-config/${NAME}MSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/${NAME}MSP/orderer4.${DOMAIN}/msp/admincerts/${DOMAIN}-admin-cert.pem

