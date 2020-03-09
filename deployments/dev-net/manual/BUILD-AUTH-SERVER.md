# Overview

There are a few case of developing auth-server.

## Usage A: Build auth-image image, and launch local environment

Running below script will perform below tasks.

- clean up directory
- tsc compile
- build auth-server image
- launch `compose.auth-server.yaml` network

This is mainly used for local development. And, the Github CI workflow will be similarly implemented, as the
steps in below script file.

```shell script
################################
# Build Auth-Server Image and Run local development network in docker-compose
################################
./build-run-auth.sh
```

## Usage B: Manual instructions for building auth-server image

If you are develop the _auth-server_ docker image, you may consider perform manual steps, for sake of troubleshooting.

### _Step 1: Validate build material for your organization of a given deployment_

Below example is based on _gw-dev-net_ . All build material is located at `~/deployments/gw-dev-net/build.gw-org[X]`.

- Validate `~/deployments/dev-net/build.auth/.env.prod` content, for default environment variables, for auth-server.
- Validate `~/deployments/dev-net/build.gw-org[X]/.env.prod` content, for default environment variables, for gw-org.
- Validate `~/deployments/dev-net/build.gw-org[X]/connection-org[X].prod.yaml`, connection profile per org.

### _Step 2: Build context_

```shell script
# send the build content to ./build directory
yarn build:auth
```

### _Step 3: Build images_

```shell script
# build it locally
# go to project root, e.g. cd ~
# or alternatively, pick namespace hktfp5/auth-server
DOCKER_BUILD=1 docker build --no-cache -f ./auth-server.dockerfile -t espresso/auth-server:1.0 .
```

### _Step 4: Launch Postgres_

_Option 1: (Preferred) local machine Setup: embeded in docker-compose_

See sample `~/deployments/dev-net/compose.auth-server.yaml`. Intentionally, the boilerplated
`docker-compose.yaml` includes auth-server images. Other boilerplated network may not includes `auth-server`,
and therefore, need to add it manually.

```yaml
auth-server:
  image: espresso/auth-server:1.0
  container_name: auth-server
  environment:
    - TYPEORM_HOST=postgres01
    - TYPEORM_PORT=5432
    - TYPEORM_USERNAME=postgres
    - TYPEORM_PASSWORD=docker
    - TYPEORM_DATABASE=auth_db
  ports:
    - 3900:8080
  depends_on:
    - postgres01
  networks:
    - openplatform
```

_Option 2: local machine Setup: standalone postgres_

```shell script
# Using localhost, can be used for local development.
# However, the port 5432 will conflict with postgres defined boilerplated docker-compose.yaml
# If using boilerplated docker-compose up, you should not run this command.
docker run -d \
  -e POSTGRES_PASSWORD=docker \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=postgres \
  -v ./packages/authentication/.volume:/var/lib/postgresql/data \
  --name postgres-dev -p 5432:5432 postgres

# OR directly re-use postgres01 defined in the docker-compose.yaml
# no setting is required
```

_Option 3: If using Google Cloud Setup_

- Goto (require login) [Google Cloud SQL/fdi-test-net](https://console.cloud.google.com/sql/instances/fdi-test-net/connections?cloudshell=false&project=fdi-test-net)
- Under Connectivity
- Under Public IP
- Whitelist your IP

Note: currently, I have create only one database `auth_db` instance

```shell script
# Using Google Cloud SQL
docker run -e TYPEORM_HOST=35.239.77.51 \
  -e TYPEORM_USERNAME=postgres \
  -e TYPEORM_PASSWORD=docker \
  -e TYPEORM_LOGGING=true \
  -e TYPEORM_DATABASE=auth_db \
  --name auth-server \
  -p 3900:8080 espresso/auth-server:1.0
```

### _Step 5: optionally, create auth_db, if using local machine_

(a) If you choose option 1 (preferred), this step can be skipped. OR,
(b) If you choose option 2, it needs additional step to create `auth_db` manually.

```shell script
# sh to the running postgres container
docker exec -it postgres01 bash

# Create auth_db
su - postgres
psql
DROP DATABASE IF EXISTS auth_db;
CREATE DATABASE auth_db;
\l
\q
exit
```

### _Step 6: run auth server_

(a) Assuming using option 1 (preferred) in step 4:

```shell script
export VOLUME=./volume

docker-compose -f compose.auth-server.yaml up -d
```

(b) Assuming using option 2 in Step 4:

```shell script
# It will work only if postgres run on assessible network, e.g. standalone installation.
#docker run \
#  -e TYPEORM_HOST=localhost \
#  -e TYPEORM_PORT=5432 \
#  -e TYPEORM_USERNAME=postgres \
#  -e TYPEORM_PASSWORD=docker \
#  -e TYPEORM_DATABASE=auth_db \
#  --name auth-server \
#  -p 3900:8080 espresso/auth-server:1.0
```

open `http://localhost:3900/graphql`

or display running status with below pm2 command.

```shell script
# display running process
docker exec auth-server1 pm2 list

# should return:
┌─────┬────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name           │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ auth-server    │ default     │ 1.0.0   │ cluster │ 17       │ 70s    │ 0    │ online    │ 0%       │ 68.4mb   │ node     │ disabled │
└─────┴────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘


# display logs captured by pm2
docker exec auth-server1 pm2 logs
```
