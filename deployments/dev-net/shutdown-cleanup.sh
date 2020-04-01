. ./setup.sh

docker-compose -f $COMPOSE_1 down

docker rm -f $(docker ps -aq -f status=exited)

sudo rm -rf ./artifacts

# docker rm -f $(docker ps -aq -f name=dev-*)
#docker-compose -p ci -f ./docker-compose.ci.yaml kill
#docker-compose -p ci -f ./docker-compose.ci.yaml rm -f
