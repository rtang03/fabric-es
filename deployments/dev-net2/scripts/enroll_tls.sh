# Enroll tls-ca.org0.com's Admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/Org0MSP/tls/server/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/Org0MSP/tls/admin

fabric-ca-client enroll -d -u https://tls-ca-admin:tls-ca-adminPW@0.0.0.0:5052
fabric-ca-client register -d --id.name peer0.org1.net --id.secret 9d8vdCdk --id.type peer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name peer0.org2.net --id.secret zkZDG96L --id.type peer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name peer0.org3.net --id.secret zkZDG96L --id.type peer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name orderer0.org0.com --id.secret PCzEE5x2 --id.type orderer -u https://0.0.0.0:5052

#############
# org1 peer0#
#############

# Copy certificate of the TLS CA for org1 peer0
mkdir -p /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/assets/tls-ca
cp /var/artifacts/crypto-config/Org0MSP/tls/admin/msp/cacerts/0-0-0-0-5052.pem /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/assets/tls-ca/tls-ca-cert.pem

# Enroll org1 peer0
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer0.org1.net:9d8vdCdk@0.0.0.0:5052 --enrollment.profile tls --csr.hosts peer0-org1,127.0.0.1

mv /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/keystore/* /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/keystore/key.pem

#############
# org2 peer0#
#############

# Copy certificate of the TLS CA for org2 peer0
mkdir -p /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/assets/tls-ca
cp /var/artifacts/crypto-config/Org0MSP/tls/admin/msp/cacerts/0-0-0-0-5052.pem /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/assets/tls-ca/tls-ca-cert.pem

# Enroll org2 peer0
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/Org2MSP/peer0.org2.net
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/Org2MSP/peer0.org2.net/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer0.org2.net:zkZDG96L@0.0.0.0:5052 --enrollment.profile tls --csr.hosts peer0-org2,127.0.0.1

mv /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/keystore/* /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/keystore/key.pem

#############
# org3 peer0#
#############

# Copy certificate of the TLS CA for org3 peer0
mkdir -p /var/artifacts/crypto-config/Org3MSP/peer0.org3.net/assets/tls-ca
cp /var/artifacts/crypto-config/Org0MSP/tls/admin/msp/cacerts/0-0-0-0-5052.pem /var/artifacts/crypto-config/Org3MSP/peer0.org3.net/assets/tls-ca/tls-ca-cert.pem

# Enroll org3 peer0
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/Org3MSP/peer0.org3.net
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/Org3MSP/peer0.org3.net/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer0.org3.net:zkZDG96L@0.0.0.0:5052 --enrollment.profile tls --csr.hosts peer0-org3,127.0.0.1

mv /var/artifacts/crypto-config/Org3MSP/peer0.org3.net/tls-msp/keystore/* /var/artifacts/crypto-config/Org3MSP/peer0.org3.net/tls-msp/keystore/key.pem

###########
# Orderer #
###########

# Copy certificate of tls-ca.org0.com for org0 orderer0
mkdir -p /var/artifacts/crypto-config/Org0MSP/orderer0.org0.com/assets/tls-ca
cp /var/artifacts/crypto-config/Org0MSP/tls/admin/msp/cacerts/0-0-0-0-5052.pem /var/artifacts/crypto-config/Org0MSP/orderer0.org0.com/assets/tls-ca/tls-ca-cert.pem

# Enroll for org0 orderer0
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/Org0MSP/orderer0.org0.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/Org0MSP/orderer0.org0.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer0.org0.com:PCzEE5x2@0.0.0.0:5052 --enrollment.profile tls --csr.hosts orderer0-org0,127.0.0.1

mv /var/artifacts/crypto-config/Org0MSP/orderer0.org0.com/tls-msp/keystore/* /var/artifacts/crypto-config/Org0MSP/orderer0.org0.com/tls-msp/keystore/key.pem

# Copy certificate of tls-ca.org0.com for org0 orderer1
mkdir -p /var/artifacts/crypto-config/Org0MSP/orderer1.org0.com/assets/tls-ca
cp /var/artifacts/crypto-config/Org0MSP/tls/admin/msp/cacerts/0-0-0-0-5052.pem /var/artifacts/crypto-config/Org0MSP/orderer1.org0.com/assets/tls-ca/tls-ca-cert.pem
