docker-compose -f config/auth.yaml down --volumes
docker-compose -f config/db.yaml down --volumes
docker network prune -f
docker system prune -f