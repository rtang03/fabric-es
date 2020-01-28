
_NOTE: not test yet. Path maybe wrong._

DOCKER_BUILDKIT=1 docker build --no-cache -f ./authentication-server/Dockerfile -t=gcr.io/fdi-test-net/auth-server:1.0 .

DOCKER_BUILDKIT=1 docker build --no-cache -f ./fabric-ca/Dockerfile -t=gcr.io/fdi-test-net/fabric-ca:1.4.4 .

docker run -e TYPEORM_HOST=xxx.xxx.xxx.xxx \
-e TYPEORM_USERNAME=postgres \
-e TYPEORM_PASSWORD=docker \
-e TYPEORM_LOGGING=true \
-p 3900:8080 fdi-test-net/auth-server:1.0

gcloud builds submit --tag gcr.io/PROJECT-ID/helloworld
gcloud run deploy --image gcr.io/PROJECT-ID/helloworld --platform managed
