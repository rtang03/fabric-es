## install_chaincode.sh [org] [peer] [name] [version] [port] [admin cert path] [peer cert path]
## Example: ./install_chaincode.sh org1 peer1 eventstore 1.0 7051 org1/admin org1/peer0
if [ $# -ne 7 ]
then
    echo [`date +"%Y-%m-%d %H:%M:%S"`] "Usage: install_chaincode.sh [org] [peer] [name] [version] [port] [admin cert path] [peer cert path]" \
         "(e.g. : ./install_chaincode.sh org1 peer1 eventstore 1.0 7051 org1/admin org1/peer0)"
    exit 1
fi

org="$1"
peer="$2"
name="$3"
version="$4"
port="$5"
adm_crt_path="$6"
peer_crt_path="$7"

export CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/${adm_crt_path}/msp
export CORE_PEER_ADDRESS=${peer}.${org}:${port}

# Install Chaincode
peer chaincode install -n ${name} -v ${version} -p /opt/gopath/src/github.com/hyperledger/fabric/chaincode -l node \
    --tls --cafile /tmp/hyperledger/${peer_crt_path}/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

peer chaincode list --installed