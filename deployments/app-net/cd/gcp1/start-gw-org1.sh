docker-compose -f docker-compose-org1.yaml down
docker rmi -f build:5000/auth-server
docker rmi -f build:5000/gw-org1
docker-compose -f docker-compose-org1.yaml up -d