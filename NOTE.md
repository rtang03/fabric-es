## Instruction for AUTH-SERVER
```shell script
# build it locally
DOCKER_BUILD=1 docker build --no-cache -f ./auth-server.dockerfile -t hktfp5/auth-server:1.0 .

# Using Google Cloud SQL
docker run -e TYPEORM_HOST=35.239.77.51 \
 -e TYPEORM_USERNAME=postgres \
 -e TYPEORM_PASSWORD=docker \
 -e TYPEORM_LOGGING=true \
 -e TYPEORM_DATABASE=auth_db \
 -p 3900:8080 hktfp5/auth-server:1.0 
 
# Using localhost
docker run -e TYPEORM_HOST=locahost \
 -e TYPEORM_PORT=5432
 -e TYPEORM_USERNAME=postgres \
 -e TYPEORM_PASSWORD=docker \
 -e TYPEORM_LOGGING=true \
 -e TYPEORM_DATABASE=auth_db \
 -p 3900:8080 hktfp5/auth-server:1.0 
```

### If using Google Cloud Setup  
Step 1: Goto  (require login)  
https://console.cloud.google.com/sql/instances/fdi-test-net/connections?cloudshell=false&project=fdi-test-net

Step 2: Under Connectivity  

Step 3: Under Public IP  

Step 4: Whitelist your IP

Note: currently, I have create only one database `auth_db` instance

### Run Auth Server  
open http://localhost:3900/graphql

## Instruction for GW-ORG1
```shell script
# build it locally
DOCKER_BUILD=1 docker build --no-cache -f ./gw-org1.dockerfile -t espresso/gw-org1:1.0 .

docker run \
-v `pwd`/packages/gw-org1/assets/:/home/app/packages/gw-org1/assets \
-v `pwd`/packages/gw-org1/connection/:/home/app/packages/gw-org1/connection \
-v `pwd`/packages/gw-org1/logs/:/home/app/packages/gw-org1/logs \
-p 4000:4001 espresso/gw-org1:1.0
```

