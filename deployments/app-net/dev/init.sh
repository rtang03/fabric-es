rm -rf data/*
docker-compose -f config/db.yaml up -d
sleep 50
docker-compose -f config/auth.yaml up -d
docker ps -a
