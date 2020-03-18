#!/usr/bin/env bash

SECRET=9d8vdCdk
ODR_CODE=$1
PORT=5999
ODR_NAME=XXXX
ORG_NAME=XXXX
getConfig() {
  case $1 in
    org0)
      ODR_NAME="Org0"
      PORT=5052
      ;;
    org1)
      ORG_NAME="Org1"
      ;;
    org2)
      ORG_NAME="Org2"
      ;;
    org3)
      ORG_NAME="Org3"
      ;;
  esac
}

getConfig $ODR_CODE

# Enroll tls-ca's Admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${ODR_NAME}MSP/tls/server/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${ODR_NAME}MSP/tls/admin

fabric-ca-client enroll -d -u https://tls-ca-admin:tls-ca-adminPW@0.0.0.0:${PORT}
for ORG in $2
do
  fabric-ca-client register -d --id.name peer0.${ORG}.net --id.secret $SECRET --id.type peer -u https://0.0.0.0:${PORT}
done
fabric-ca-client register -d --id.name orderer0.${ODR_CODE}.com --id.secret PCzEE5x2 --id.type orderer -u https://0.0.0.0:${PORT}

# Peers
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
for ORG in $2
do
  getConfig $ORG

  # Copy certificate of the TLS CA for peer0
  mkdir -p /var/artifacts/crypto-config/${ORG_NAME}MSP/peer0.${ORG}.net/assets/tls-ca
  cp /var/artifacts/crypto-config/${ODR_NAME}MSP/tls/admin/msp/cacerts/0-0-0-0-${PORT}.pem /var/artifacts/crypto-config/${ORG_NAME}MSP/peer0.${ORG}.net/assets/tls-ca/tls-ca-cert.pem

  # Enroll peer0
  export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${ORG_NAME}MSP/peer0.${ORG}.net
  export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${ORG_NAME}MSP/peer0.${ORG}.net/assets/tls-ca/tls-ca-cert.pem
  fabric-ca-client enroll -d -u https://peer0.${ORG}.net:${SECRET}@0.0.0.0:${PORT} --enrollment.profile tls --csr.hosts peer0-${ORG},127.0.0.1

  mv /var/artifacts/crypto-config/${ORG_NAME}MSP/peer0.${ORG}.net/tls-msp/keystore/* /var/artifacts/crypto-config/${ORG_NAME}MSP/peer0.${ORG}.net/tls-msp/keystore/key.pem
done

# Copy certificate of tls-ca for orderer0
mkdir -p /var/artifacts/crypto-config/${ODR_NAME}MSP/orderer0.${ODR_CODE}.com/assets/tls-ca
cp /var/artifacts/crypto-config/${ODR_NAME}MSP/tls/admin/msp/cacerts/0-0-0-0-${PORT}.pem /var/artifacts/crypto-config/${ODR_NAME}MSP/orderer0.${ODR_CODE}.com/assets/tls-ca/tls-ca-cert.pem

# Enroll for orderer
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/${ODR_NAME}MSP/orderer0.${ODR_CODE}.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/${ODR_NAME}MSP/orderer0.${ODR_CODE}.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer0.${ODR_CODE}.com:PCzEE5x2@0.0.0.0:${PORT} --enrollment.profile tls --csr.hosts orderer0-${ODR_CODE},127.0.0.1

mv /var/artifacts/crypto-config/${ODR_NAME}MSP/orderer0.${ODR_CODE}.com/tls-msp/keystore/* /var/artifacts/crypto-config/${ODR_NAME}MSP/orderer0.${ODR_CODE}.com/tls-msp/keystore/key.pem
