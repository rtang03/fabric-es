#! /bin/bash
# https://cloud.google.com/run/docs/building/containers
mkdir -p ./assets/HktfpMSP
cp -R ../../network2/artifacts/crypto-config/HktfpMSP ./assets
#  gcloud auth configure-docker
DOCKER_BUILDKIT=1 docker build --no-cache -t=gcr.io/fdi-test-net/fabric-ca:1.4.4 .
docker push gcr.io/fdi-test-net/fabric-ca:1.4.4
docker run --name tls-ca.hktfp.com -p 8080:8080 -it gcr.io/fdi-test-net/fabric-ca:1.4.4

# local docker image
export FABRIC_CA_CLIENT_HOME=$PWD/assets/HktfpMSP/tls-ca/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=$PWD/assets/HktfpMSP/tls/server/ca-cert.pem
fabric-ca-client enroll -d -u https://tls-ca-admin:tls-ca-adminPW@0.0.0.0:8080

# google
export FABRIC_CA_CLIENT_HOME=$PWD/assets/HktfpMSP/tls-ca/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=$PWD/assets/HktfpMSP/tls/server/ca-cert.pem
fabric-ca-client enroll -d -u http://tls-ca-admin:tls-ca-adminPW@35.222.19.221
