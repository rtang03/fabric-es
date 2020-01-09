# Import common.sh
. `pwd`/common.sh

# export .env variables
export $(grep -v '^#' ${_FABRIC_DIR}/.env | xargs)

# Start the network
docker-compose -f ${_YAML_FILE} up -d

# Remove the exited (Not-yet-ready) containers
sleep 5
docker rm -f $(docker ps -aq -f status=exited)
