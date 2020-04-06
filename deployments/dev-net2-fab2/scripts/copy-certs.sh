#!/usr/bin/env bash

# $1 - crypto material root path
# $2 - Org0; Org1; Org2; Org3
# $3 - domain
# $4 - peer

mkdir -p ${1}/${2}MSP/msp/admincerts
mkdir -p ${1}/${2}MSP/msp/cacerts
mkdir -p ${1}/${2}MSP/msp/tlscacerts
mkdir -p ${1}/${2}MSP/msp/users

cp ${1}/${2}MSP/${4}.${3}/msp/admincerts/${3}-admin-cert.pem ${1}/${2}MSP/msp/admincerts
cp ${1}/${2}MSP/${4}.${3}/assets/ca/${3}-ca-cert.pem ${1}/${2}MSP/msp/cacerts
cp ${1}/${2}MSP/${4}.${3}/assets/tls-ca/tls-ca-cert.pem ${1}/${2}MSP/msp/tlscacerts
