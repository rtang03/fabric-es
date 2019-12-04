#!/bin/bash
## install_chaincode.sh [org] [peer] [name] [path] [version] [port]
## Example: ./install_chaincode.sh org3 peer1 fabcar fabcar/typescript 2.0 7051
if [ $# -ne 6 ]
then
    echo [`date +"%Y-%m-%d %H:%M:%S"`] "Usage: install_chaincode.sh [org] [peer] [name] [path] [version]  [port]" \
         "(e.g. : ./install_chaincode.sh org3 peer1 fabcar fabcar/typescript 2.0 7051)"
    exit 1
fi

org="$1"
peer="$2"
name="$3"
path="$4"
version="$5"
port="$6"

export CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/${org}/admin/msp
export CORE_PEER_ADDRESS=${peer}-${org}:${port}

# Build Chaincode
cd /opt/gopath/src/github.com/hyperledger/fabric/chaincode/${path}
npm install
npm run build
sleep 3

# Install Chaincode
peer chaincode install -n ${name} -v ${version} -p /opt/gopath/src/github.com/hyperledger/fabric/chaincode/${path} -l node \
    --tls --cafile /var/artifacts/crypto-config/${org}/${peer}/tls-msp/tlscacerts/tls-0-0-0-0-6052.pem

peer chaincode list --installed