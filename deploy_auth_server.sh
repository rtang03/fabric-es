#! /bin/bash
yarn build:authentication
docker image build -f ./packages/authentication/Dockerfile -t=fdi-test-net/auth-server:1.0 .
docker run -e TYPEORM_HOST=xxx.xxx.xxx.xxx \
-e TYPEORM_USERNAME=postgres \
-e TYPEORM_PASSWORD=password \
-e TYPEORM_LOGGING=true \
-p 3900:8080 fdi-test-net/auth-server:1.0
