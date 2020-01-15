
# Enroll ca.tls's Admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/TLS-CA/server/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/TLS-CA/admin

fabric-ca-client enroll -d -u https://tls-ca-admin:tls-ca-adminPW@0.0.0.0:5052
fabric-ca-client register -d --id.name peer0.org1.example.com --id.secret peer0PW --id.type peer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name peer1.org1.example.com --id.secret peer1PW --id.type peer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name peer0.org2.example.com --id.secret peer0PW --id.type peer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name peer1.org2.example.com --id.secret peer1PW --id.type peer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name peer0.org3.neworg.com --id.secret peer0PW --id.type peer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name peer1.org3.neworg.com --id.secret peer1PW --id.type peer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name orderer1.example.com --id.secret ordererPW --id.type orderer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name orderer2.example.com --id.secret ordererPW --id.type orderer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name orderer3.example.com --id.secret ordererPW --id.type orderer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name orderer4.example.com --id.secret ordererPW --id.type orderer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name orderer5.example.com --id.secret ordererPW --id.type orderer -u https://0.0.0.0:5052

#############
# Org1MSP peer0#
#############

# Copy certificate of the TLS CA for Org1MSP peer0
mkdir -p /tmp/hyperledger/Org1MSP/peer0.org1.example.com/assets/tls-ca
cp /tmp/hyperledger/TLS-CA/admin/msp/cacerts/0-0-0-0-5052.pem /tmp/hyperledger/Org1MSP/peer0.org1.example.com/assets/tls-ca/tls-ca-cert.pem

# Enroll Org1MSP peer0
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/Org1MSP/peer0.org1.example.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/Org1MSP/peer0.org1.example.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer0.org1.example.com:peer0PW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts peer0.org1.example.com,127.0.0.1

mv /tmp/hyperledger/Org1MSP/peer0.org1.example.com/tls-msp/keystore/* /tmp/hyperledger/Org1MSP/peer0.org1.example.com/tls-msp/keystore/key.pem

#############
# Org1MSP peer1#
#############

# Copy certificate of the TLS CA for Org1MSP peer1
mkdir -p /tmp/hyperledger/Org1MSP/peer1.org1.example.com/assets/tls-ca
cp /tmp/hyperledger/TLS-CA/admin/msp/cacerts/0-0-0-0-5052.pem /tmp/hyperledger/Org1MSP/peer1.org1.example.com/assets/tls-ca/tls-ca-cert.pem

# Enroll Org1MSP peer1
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/Org1MSP/peer1.org1.example.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/Org1MSP/peer1.org1.example.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer1.org1.example.com:peer1PW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts peer1.org1.example.com,127.0.0.1

mv /tmp/hyperledger/Org1MSP/peer1.org1.example.com/tls-msp/keystore/* /tmp/hyperledger/Org1MSP/peer1.org1.example.com/tls-msp/keystore/key.pem

#############
# Org2MSP peer0#
#############

# Copy certificate of the TLS CA for Org2MSP peer0
mkdir -p /tmp/hyperledger/Org2MSP/peer0.org2.example.com/assets/tls-ca
cp /tmp/hyperledger/TLS-CA/admin/msp/cacerts/0-0-0-0-5052.pem /tmp/hyperledger/Org2MSP/peer0.org2.example.com/assets/tls-ca/tls-ca-cert.pem

# Enroll Org2MSP peer0
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/Org2MSP/peer0.org2.example.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/Org2MSP/peer0.org2.example.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer0.org2.example.com:peer0PW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts peer0.org2.example.com,127.0.0.1

mv /tmp/hyperledger/Org2MSP/peer0.org2.example.com/tls-msp/keystore/* /tmp/hyperledger/Org2MSP/peer0.org2.example.com/tls-msp/keystore/key.pem

#############
# Org2MSP peer1#
#############

# Copy certificate of the TLS CA for Org2MSP peer1
mkdir -p /tmp/hyperledger/Org2MSP/peer1.org2.example.com/assets/tls-ca
cp /tmp/hyperledger/TLS-CA/admin/msp/cacerts/0-0-0-0-5052.pem /tmp/hyperledger/Org2MSP/peer1.org2.example.com/assets/tls-ca/tls-ca-cert.pem

# Enroll Org2MSP peer1
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/Org2MSP/peer1.org2.example.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/Org2MSP/peer1.org2.example.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer1.org2.example.com:peer1PW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts peer1.org2.example.com,127.0.0.1

mv /tmp/hyperledger/Org2MSP/peer1.org2.example.com/tls-msp/keystore/* /tmp/hyperledger/Org2MSP/peer1.org2.example.com/tls-msp/keystore/key.pem

#############
# Org3MSP peer0#
#############

# Copy certificate of the TLS CA for Org3MSP peer0
mkdir -p /tmp/hyperledger/Org3MSP/peer0.org3.neworg.com/assets/tls-ca
cp /tmp/hyperledger/TLS-CA/admin/msp/cacerts/0-0-0-0-5052.pem /tmp/hyperledger/Org3MSP/peer0.org3.neworg.com/assets/tls-ca/tls-ca-cert.pem

# Enroll Org3MSP peer0
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/Org3MSP/peer0.org3.neworg.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/Org3MSP/peer0.org3.neworg.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer0.org3.neworg.com:peer0PW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts peer0.org3.neworg.com,127.0.0.1

mv /tmp/hyperledger/Org3MSP/peer0.org3.neworg.com/tls-msp/keystore/* /tmp/hyperledger/Org3MSP/peer0.org3.neworg.com/tls-msp/keystore/key.pem

#############
# Org3MSP peer1#
#############

# Copy certificate of the TLS CA for Org3MSP peer1
mkdir -p /tmp/hyperledger/Org3MSP/peer1.org3.neworg.com/assets/tls-ca
cp /tmp/hyperledger/TLS-CA/admin/msp/cacerts/0-0-0-0-5052.pem /tmp/hyperledger/Org3MSP/peer1.org3.neworg.com/assets/tls-ca/tls-ca-cert.pem

# Enroll Org3MSP peer1
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/Org3MSP/peer1.org3.neworg.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/Org3MSP/peer1.org3.neworg.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer1.org3.neworg.com:peer1PW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts peer1.org3.neworg.com,127.0.0.1

mv /tmp/hyperledger/Org3MSP/peer1.org3.neworg.com/tls-msp/keystore/* /tmp/hyperledger/Org3MSP/peer1.org3.neworg.com/tls-msp/keystore/key.pem


###########
# Orderer #
###########

# Copy certificate of ca.tls for OrdererOrg orderer1
mkdir -p /tmp/hyperledger/OrdererMSP/orderer1.example.com/assets/tls-ca
cp /tmp/hyperledger/TLS-CA/admin/msp/cacerts/0-0-0-0-5052.pem /tmp/hyperledger/OrdererMSP/orderer1.example.com/assets/tls-ca/tls-ca-cert.pem

# Enroll for OrdererOrg orderer1
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/OrdererMSP/orderer1.example.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/OrdererMSP/orderer1.example.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer1.example.com:ordererPW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts orderer1.example.com,127.0.0.1

mv /tmp/hyperledger/OrdererMSP/orderer1.example.com/tls-msp/keystore/* /tmp/hyperledger/OrdererMSP/orderer1.example.com/tls-msp/keystore/key.pem

# Copy certificate of ca.tls for OrdererOrg orderer2
mkdir -p /tmp/hyperledger/OrdererMSP/orderer2.example.com/assets/tls-ca
cp /tmp/hyperledger/TLS-CA/admin/msp/cacerts/0-0-0-0-5052.pem /tmp/hyperledger/OrdererMSP/orderer2.example.com/assets/tls-ca/tls-ca-cert.pem

# Enroll for OrdererOrg orderer2
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/OrdererMSP/orderer2.example.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/OrdererMSP/orderer2.example.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer2.example.com:ordererPW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts orderer2.example.com,127.0.0.1

mv /tmp/hyperledger/OrdererMSP/orderer2.example.com/tls-msp/keystore/* /tmp/hyperledger/OrdererMSP/orderer2.example.com/tls-msp/keystore/key.pem

# Copy certificate of ca.tls for OrdererOrg orderer3
mkdir -p /tmp/hyperledger/OrdererMSP/orderer3.example.com/assets/tls-ca
cp /tmp/hyperledger/TLS-CA/admin/msp/cacerts/0-0-0-0-5052.pem /tmp/hyperledger/OrdererMSP/orderer3.example.com/assets/tls-ca/tls-ca-cert.pem

# Enroll for OrdererOrg orderer3
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/OrdererMSP/orderer3.example.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/OrdererMSP/orderer3.example.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer3.example.com:ordererPW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts orderer3.example.com,127.0.0.1

mv /tmp/hyperledger/OrdererMSP/orderer3.example.com/tls-msp/keystore/* /tmp/hyperledger/OrdererMSP/orderer3.example.com/tls-msp/keystore/key.pem

# Copy certificate of ca.tls for OrdererOrg orderer4
mkdir -p /tmp/hyperledger/OrdererMSP/orderer4.example.com/assets/tls-ca
cp /tmp/hyperledger/TLS-CA/admin/msp/cacerts/0-0-0-0-5052.pem /tmp/hyperledger/OrdererMSP/orderer4.example.com/assets/tls-ca/tls-ca-cert.pem

# Enroll for OrdererOrg orderer4
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/OrdererMSP/orderer4.example.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/OrdererMSP/orderer4.example.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer4.example.com:ordererPW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts orderer4.example.com,127.0.0.1

mv /tmp/hyperledger/OrdererMSP/orderer4.example.com/tls-msp/keystore/* /tmp/hyperledger/OrdererMSP/orderer4.example.com/tls-msp/keystore/key.pem

# Copy certificate of ca.tls for OrdererOrg orderer5
mkdir -p /tmp/hyperledger/OrdererMSP/orderer5.example.com/assets/tls-ca
cp /tmp/hyperledger/TLS-CA/admin/msp/cacerts/0-0-0-0-5052.pem /tmp/hyperledger/OrdererMSP/orderer5.example.com/assets/tls-ca/tls-ca-cert.pem

# Enroll for OrdererOrg orderer5
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/OrdererMSP/orderer5.example.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/OrdererMSP/orderer5.example.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer5.example.com:ordererPW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts orderer5.example.com,127.0.0.1

mv /tmp/hyperledger/OrdererMSP/orderer5.example.com/tls-msp/keystore/* /tmp/hyperledger/OrdererMSP/orderer5.example.com/tls-msp/keystore/key.pem

