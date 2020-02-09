###################################
# Common properties and Functions
###################################
_PRGDIR=`pwd`
_PRGNAME=`basename $0`
_FABRIC_CONFIG="config"
_FABRIC_DIR="${_PRGDIR}/../${_FABRIC_CONFIG}"
_CHAINCODE_DIR="${_PRGDIR}/../../../packages/chaincode"
_HYPERLEDGER_DIR="${_FABRIC_DIR}/../artifacts"
_CRYPTO_CONFIG_DIR="${_HYPERLEDGER_DIR}/"
_LOG_DIR="${_PRGDIR}/../logs"
_CURRENTDATE=`date +"%Y%m%d"`
_LOGFILE="${_LOG_DIR}/${_PRGNAME}-${_CURRENTDATE}.log"
_YAML_FILE="${_FABRIC_DIR}/docker-compose.yaml"
_BIN_DIR="/Users/paul/proj/fabric-bin"