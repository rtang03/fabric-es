docker-compose -f config/db.yaml up -d
sleep 2
docker-compose -f config/auth.yaml up -d
docker ps -a