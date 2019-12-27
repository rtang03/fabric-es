
# Enroll ca.tls's Admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/ca.tls/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/ca.tls/admin

fabric-ca-client enroll -d -u https://tls-ca-admin:tls-ca-adminPW@0.0.0.0:5052
fabric-ca-client register -d --id.name peer0.org1.example.com --id.secret peer0PW --id.type peer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name peer1.org1.example.com --id.secret peer1PW --id.type peer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name peer0.org2.example.com --id.secret peer0PW --id.type peer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name peer1.org2.example.com --id.secret peer1PW --id.type peer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name orderer1.example.com --id.secret ordererPW --id.type orderer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name orderer2.example.com --id.secret ordererPW --id.type orderer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name orderer3.example.com --id.secret ordererPW --id.type orderer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name orderer4.example.com --id.secret ordererPW --id.type orderer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name orderer5.example.com --id.secret ordererPW --id.type orderer -u https://0.0.0.0:5052

#############
# Org1MSP peer0#
#############

# Copy certificate of the TLS CA for Org1MSP peer0
mkdir -p /tmp/hyperledger/org1.example.com/peer0/assets/tls-ca
cp /tmp/hyperledger/ca.tls/admin/msp/cacerts/0-0-0-0-5052.pem /tmp/hyperledger/org1.example.com/peer0/assets/tls-ca/tls-ca-cert.pem

# Enroll Org1MSP peer0
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org1.example.com/peer0
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org1.example.com/peer0/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer0.org1.example.com:peer0PW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts peer0.org1.example.com,127.0.0.1

mv /tmp/hyperledger/org1.example.com/peer0/tls-msp/keystore/* /tmp/hyperledger/org1.example.com/peer0/tls-msp/keystore/key.pem

#############
# Org1MSP peer1#
#############

# Copy certificate of the TLS CA for Org1MSP peer1
mkdir -p /tmp/hyperledger/org1.example.com/peer1/assets/tls-ca
cp /tmp/hyperledger/ca.tls/admin/msp/cacerts/0-0-0-0-5052.pem /tmp/hyperledger/org1.example.com/peer1/assets/tls-ca/tls-ca-cert.pem

# Enroll Org1MSP peer1
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org1.example.com/peer1
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org1.example.com/peer1/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer1.org1.example.com:peer1PW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts peer1.org1.example.com,127.0.0.1

mv /tmp/hyperledger/org1.example.com/peer1/tls-msp/keystore/* /tmp/hyperledger/org1.example.com/peer1/tls-msp/keystore/key.pem

#############
# Org2MSP peer0#
#############

# Copy certificate of the TLS CA for Org2MSP peer0
mkdir -p /tmp/hyperledger/org2.example.com/peer0/assets/tls-ca
cp /tmp/hyperledger/ca.tls/admin/msp/cacerts/0-0-0-0-5052.pem /tmp/hyperledger/org2.example.com/peer0/assets/tls-ca/tls-ca-cert.pem

# Enroll Org2MSP peer0
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org2.example.com/peer0
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org2.example.com/peer0/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer0.org2.example.com:peer0PW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts peer0.org2.example.com,127.0.0.1

mv /tmp/hyperledger/org2.example.com/peer0/tls-msp/keystore/* /tmp/hyperledger/org2.example.com/peer0/tls-msp/keystore/key.pem

#############
# Org2MSP peer1#
#############

# Copy certificate of the TLS CA for Org2MSP peer1
mkdir -p /tmp/hyperledger/org2.example.com/peer1/assets/tls-ca
cp /tmp/hyperledger/ca.tls/admin/msp/cacerts/0-0-0-0-5052.pem /tmp/hyperledger/org2.example.com/peer1/assets/tls-ca/tls-ca-cert.pem

# Enroll Org2MSP peer1
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org2.example.com/peer1
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org2.example.com/peer1/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer1.org2.example.com:peer1PW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts peer1.org2.example.com,127.0.0.1

mv /tmp/hyperledger/org2.example.com/peer1/tls-msp/keystore/* /tmp/hyperledger/org2.example.com/peer1/tls-msp/keystore/key.pem


###########
# Orderer #
###########

# Copy certificate of ca.tls for OrdererOrg orderer1
mkdir -p /tmp/hyperledger/example.com/orderer1/assets/tls-ca
cp /tmp/hyperledger/ca.tls/admin/msp/cacerts/0-0-0-0-5052.pem /tmp/hyperledger/example.com/orderer1/assets/tls-ca/tls-ca-cert.pem

# Enroll for OrdererOrg orderer1
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/example.com/orderer1
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/example.com/orderer1/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer1.example.com:ordererPW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts orderer1.example.com,127.0.0.1

mv /tmp/hyperledger/example.com/orderer1/tls-msp/keystore/* /tmp/hyperledger/example.com/orderer1/tls-msp/keystore/key.pem

# Copy certificate of ca.tls for OrdererOrg orderer2
mkdir -p /tmp/hyperledger/example.com/orderer2/assets/tls-ca
cp /tmp/hyperledger/ca.tls/admin/msp/cacerts/0-0-0-0-5052.pem /tmp/hyperledger/example.com/orderer2/assets/tls-ca/tls-ca-cert.pem

# Enroll for OrdererOrg orderer2
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/example.com/orderer2
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/example.com/orderer2/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer2.example.com:ordererPW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts orderer2.example.com,127.0.0.1

mv /tmp/hyperledger/example.com/orderer2/tls-msp/keystore/* /tmp/hyperledger/example.com/orderer2/tls-msp/keystore/key.pem

# Copy certificate of ca.tls for OrdererOrg orderer3
mkdir -p /tmp/hyperledger/example.com/orderer3/assets/tls-ca
cp /tmp/hyperledger/ca.tls/admin/msp/cacerts/0-0-0-0-5052.pem /tmp/hyperledger/example.com/orderer3/assets/tls-ca/tls-ca-cert.pem

# Enroll for OrdererOrg orderer3
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/example.com/orderer3
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/example.com/orderer3/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer3.example.com:ordererPW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts orderer3.example.com,127.0.0.1

mv /tmp/hyperledger/example.com/orderer3/tls-msp/keystore/* /tmp/hyperledger/example.com/orderer3/tls-msp/keystore/key.pem

# Copy certificate of ca.tls for OrdererOrg orderer4
mkdir -p /tmp/hyperledger/example.com/orderer4/assets/tls-ca
cp /tmp/hyperledger/ca.tls/admin/msp/cacerts/0-0-0-0-5052.pem /tmp/hyperledger/example.com/orderer4/assets/tls-ca/tls-ca-cert.pem

# Enroll for OrdererOrg orderer4
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/example.com/orderer4
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/example.com/orderer4/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer4.example.com:ordererPW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts orderer4.example.com,127.0.0.1

mv /tmp/hyperledger/example.com/orderer4/tls-msp/keystore/* /tmp/hyperledger/example.com/orderer4/tls-msp/keystore/key.pem

# Copy certificate of ca.tls for OrdererOrg orderer5
mkdir -p /tmp/hyperledger/example.com/orderer5/assets/tls-ca
cp /tmp/hyperledger/ca.tls/admin/msp/cacerts/0-0-0-0-5052.pem /tmp/hyperledger/example.com/orderer5/assets/tls-ca/tls-ca-cert.pem

# Enroll for OrdererOrg orderer5
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/example.com/orderer5
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/example.com/orderer5/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer5.example.com:ordererPW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts orderer5.example.com,127.0.0.1

mv /tmp/hyperledger/example.com/orderer5/tls-msp/keystore/* /tmp/hyperledger/example.com/orderer5/tls-msp/keystore/key.pem

