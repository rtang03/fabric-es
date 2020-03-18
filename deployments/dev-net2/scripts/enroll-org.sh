#!/usr/bin/env bash

# ORG=org1; org2; org3
# PORT=5054 (org1); 5055 (org2); 5056 (org3)
ORG=$1
PORT=5999
ORG_NAME=XXXX
getName() {
  case $1 in
    org1)
      ORG_NAME="Org1"
      PORT=5054
      ;;
    org2)
      ORG_NAME="Org2"
      PORT=5055
      ;;
    org3)
      ORG_NAME="Org3"
      PORT=5056
      ;;
  esac
}

getName $ORG

# Copy TLS Cert
mkdir -p /var/artifacts/crypto-config/${ORG_NAME}MSP/ca/crypto
cp /var/artifacts/crypto-config/${ORG_NAME}MSP/ca/server/ca-cert.pem /var/artifacts/crypto-config/${ORG_NAME}MSP/ca/crypto

# Register and Enroll
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${ORG_NAME}MSP/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${ORG_NAME}MSP/ca/admin
fabric-ca-client enroll -d -u https://rca-${ORG}-admin:rca-${ORG}-adminPW@0.0.0.0:${PORT}
fabric-ca-client register -d --id.name peer0.${ORG}.net --id.secret Tt4g3KLH --id.type peer -u https://0.0.0.0:${PORT}
fabric-ca-client register -d --id.name admin-${ORG}.net --id.secret Heym2rQK --id.type admin --id.attrs "hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://0.0.0.0:${PORT}

# Copy Trusted Root Cert to peer0
mkdir -p /var/artifacts/crypto-config/${ORG_NAME}MSP/peer0.${ORG}.net/assets/ca
cp /var/artifacts/crypto-config/${ORG_NAME}MSP/ca/admin/msp/cacerts/0-0-0-0-${PORT}.pem /var/artifacts/crypto-config/${ORG_NAME}MSP/peer0.${ORG}.net/assets/ca/${ORG}.net-ca-cert.pem

# Enroll peer0
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${ORG_NAME}MSP/peer0.${ORG}.net/assets/ca/${ORG}.net-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${ORG_NAME}MSP/peer0.${ORG}.net
fabric-ca-client enroll -d -u https://peer0.${ORG}.net:Tt4g3KLH@0.0.0.0:${PORT}

# Enroll Admin
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${ORG_NAME}MSP/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${ORG_NAME}MSP/peer0.${ORG}.net/assets/ca/${ORG}.net-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin-${ORG}.net:Heym2rQK@0.0.0.0:${PORT}

# Copy admin cert to peer0
mkdir -p /var/artifacts/crypto-config/${ORG_NAME}MSP/peer0.${ORG}.net/msp/admincerts
cp /var/artifacts/crypto-config/${ORG_NAME}MSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/${ORG_NAME}MSP/peer0.${ORG}.net/msp/admincerts/${ORG}.net-admin-cert.pem

# Rename admin key
mv /var/artifacts/crypto-config/${ORG_NAME}MSP/admin/msp/keystore/* /var/artifacts/crypto-config/${ORG_NAME}MSP/admin/msp/keystore/key.pem
