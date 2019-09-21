---
name: first-network-org1
version: 1.0.0

client:
  organization: Org1
  credentialStore:
    path: ./assets/client-certs/hfc-kvs/org1
    cryptoStore:
      path: ./assets/client-certs/hfc-kvs/org1
  connection:
    timeout:
      peer:
        endorser: '300'

channels:
  eventstore:
    orderers:
      - orderer.example.com
    peers:
      peer0.org1.example.com:
        endorsingPeer: true
        chaincodeQuery: true
        ledgerQuery: true
        eventSource: true
      peer1.org1.example.com:
        endorsingPeer: true
        chaincodeQuery: true
        ledgerQuery: true
        eventSource: true
    chaincodes:
      - eventstore:v0

organizations:
  Org1:
    mspid: Org1MSP
    peers:
      - peer0.org1.example.com
      - peer1.org1.example.com
    certificateAuthorities:
      - ca.org1.example.com
    adminPrivateKey:
      path: ../../network/hosts/org1/admin/msp/keystore/key.pem
    signedCert:
      path: ../../network/hosts/org1/admin/msp/signcerts/cert.pem
    client:
      path: ./connection/org1.yaml

orderers:
  orderer.example.com:
    url: grpcs://localhost:7050
    grpcOptions:
      ssl-target-name-override: orderer.example.com
    #      grpc-max-send-message-length: 4000
    tlsCACerts:
      path: ../../network/hosts/org0/orderer/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem

peers:
  peer0.org1.example.com:
    url: grpcs://localhost:7051
    eventUrl: grpcs://localhost:7053
    tlsCACerts:
      path: ../../network/hosts/org1/peer0/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
    grpcOptions:
      ssl-target-name-override: peer0.org1.example.com
  peer1.org1.example.com:
    url: grpcs://localhost:8051
    eventUrl: grpcs://localhost:8053
    tlsCACerts:
      path: ../../network/hosts/org1/peer1/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem
    grpcOptions:
      ssl-target-name-override: peer1.org1.example.com

certificateAuthorities:
  ca.org1.example.com:
    url: https://localhost:5054
    caName: ca.org1.example.com
    tlsCACerts:
      path: ../../network/hosts/org1/msp/tlscacerts/tls-ca-cert.pem
    registrar:
      - enrollId: rca-org1-admin
        enrollSecret: rca-org1-adminpw
    httpOptions:
      verify: false
