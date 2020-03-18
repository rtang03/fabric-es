#!/usr/bin/env bash

ODR_CODE=$1
PORT=5999
ODR_NAME=XXXX
getConfig() {
  case $1 in
    org0)
      ODR_NAME="Org0"
      PORT=5053
      ;;
  esac
}

getConfig $ODR_CODE

# Copy TLS Cert
mkdir -p /var/artifacts/crypto-config/${ODR_NAME}MSP/ca/crypto
cp /var/artifacts/crypto-config/${ODR_NAME}MSP/ca/server/ca-cert.pem /var/artifacts/crypto-config/${ODR_NAME}MSP/ca/crypto

# Enroll Orderer Org's CA Admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${ODR_NAME}MSP/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${ODR_NAME}MSP/ca/admin

fabric-ca-client enroll -d -u https://rca-${ODR_CODE}-admin:rca-${ODR_CODE}-adminPW@0.0.0.0:${PORT}
fabric-ca-client register -d --id.name orderer0.${ODR_CODE}.com --id.secret DPCxKv8m --id.type orderer -u https://0.0.0.0:${PORT}
fabric-ca-client register -d --id.name admin-${ODR_CODE}.com --id.secret sR7w9xWY --id.type admin --id.attrs "hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://0.0.0.0:${PORT}

# Copy Trusted Root Cert of orderer0
mkdir -p /var/artifacts/crypto-config/${ODR_NAME}MSP/orderer0.${ODR_CODE}.com/assets/ca
cp /var/artifacts/crypto-config/${ODR_NAME}MSP/ca/admin/msp/cacerts/0-0-0-0-${PORT}.pem /var/artifacts/crypto-config/${ODR_NAME}MSP/orderer0.${ODR_CODE}.com/assets/ca/${ODR_CODE}.com-ca-cert.pem

# Enroll orderer0
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${ODR_NAME}MSP/orderer0.${ODR_CODE}.com/assets/ca/${ODR_CODE}.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${ODR_NAME}MSP/orderer0.${ODR_CODE}.com
fabric-ca-client enroll -d -u https://orderer0.${ODR_CODE}.com:DPCxKv8m@0.0.0.0:${PORT}

# Enroll orderer's Admin
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${ODR_NAME}MSP/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${ODR_NAME}MSP/orderer0.${ODR_CODE}.com/assets/ca/${ODR_CODE}.com-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin-${ODR_CODE}.com:sR7w9xWY@0.0.0.0:${PORT}

# Copy admin cert to the orderer0
mkdir -p /var/artifacts/crypto-config/${ODR_NAME}MSP/orderer0.${ODR_CODE}.com/msp/admincerts
cp /var/artifacts/crypto-config/${ODR_NAME}MSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/${ODR_NAME}MSP/orderer0.${ODR_CODE}.com/msp/admincerts/${ODR_CODE}.com-admin-cert.pem
