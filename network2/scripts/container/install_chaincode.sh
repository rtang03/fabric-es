## install_chaincode.sh [org] [peer] [name] [version] [port]
## Example: ./install_chaincode.sh org1 peer1 eventstore 1.0 7051
if [ $# -ne 5 ]
then
    echo [`date +"%Y-%m-%d %H:%M:%S"`] "Usage: install_chaincode.sh [org] [peer] [name] [version] [port]" \
         "(e.g. : ./install_chaincode.sh org1 peer1 eventstore 1.0 7051)"
    exit 1
fi

org="$1"
peer="$2"
name="$3"
version="$4"
port="$5"

export CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/${org}/admin/msp
export CORE_PEER_ADDRESS=${peer}.${org}:${port}

# Build Chaincode
# cd /opt/gopath/src/github.com/hyperledger/fabric/chaincode
# npm install
# npm run build
# sleep 3

# Install Chaincode
peer chaincode install -n ${name} -v ${version} -p /opt/gopath/src/github.com/hyperledger/fabric/chaincode -l node \
    --tls --cafile /tmp/hyperledger/${org}/${peer}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

peer chaincode list --installed