
# Enroll ca.tls's Admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/TLS-CA/server/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/TLS-CA/admin

fabric-ca-client enroll -d -u https://tls-ca-admin:tls-ca-adminPW@0.0.0.0:5052
fabric-ca-client register -d --id.name peer0.org1.example.com --id.secret 9d8vdCdk --id.type peer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name peer0.org2.example.com --id.secret zkZDG96L --id.type peer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name peer0.org3.example.com --id.secret zkZDG96L --id.type peer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name orderer0.example.com --id.secret PCzEE5x2 --id.type orderer -u https://0.0.0.0:5052

#############
# Org1MSP peer0#
#############

# Copy certificate of the TLS CA for Org1MSP peer0
mkdir -p /var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com/assets/tls-ca
cp /var/artifacts/crypto-config/TLS-CA/admin/msp/cacerts/0-0-0-0-5052.pem /var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com/assets/tls-ca/tls-ca-cert.pem

# Enroll Org1MSP peer0
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer0.org1.example.com:9d8vdCdk@0.0.0.0:5052 --enrollment.profile tls --csr.hosts peer0.org1.example.com,127.0.0.1

mv /var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com/tls-msp/keystore/* /var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com/tls-msp/keystore/key.pem

#############
# Org2MSP peer0#
#############

# Copy certificate of the TLS CA for Org2MSP peer0
mkdir -p /var/artifacts/crypto-config/Org2MSP/peer0.org2.example.com/assets/tls-ca
cp /var/artifacts/crypto-config/TLS-CA/admin/msp/cacerts/0-0-0-0-5052.pem /var/artifacts/crypto-config/Org2MSP/peer0.org2.example.com/assets/tls-ca/tls-ca-cert.pem

# Enroll Org2MSP peer0
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/Org2MSP/peer0.org2.example.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/Org2MSP/peer0.org2.example.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer0.org2.example.com:zkZDG96L@0.0.0.0:5052 --enrollment.profile tls --csr.hosts peer0.org2.example.com,127.0.0.1

mv /var/artifacts/crypto-config/Org2MSP/peer0.org2.example.com/tls-msp/keystore/* /var/artifacts/crypto-config/Org2MSP/peer0.org2.example.com/tls-msp/keystore/key.pem

#############
# Org3MSP peer0#
#############

# Copy certificate of the TLS CA for Org3MSP peer0
mkdir -p /var/artifacts/crypto-config/Org3MSP/peer0.org3.example.com/assets/tls-ca
cp /var/artifacts/crypto-config/TLS-CA/admin/msp/cacerts/0-0-0-0-5052.pem /var/artifacts/crypto-config/Org3MSP/peer0.org3.example.com/assets/tls-ca/tls-ca-cert.pem

# Enroll Org3MSP peer0
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/Org3MSP/peer0.org3.example.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/Org3MSP/peer0.org3.example.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer0.org3.example.com:zkZDG96L@0.0.0.0:5052 --enrollment.profile tls --csr.hosts peer0.org3.example.com,127.0.0.1

mv /var/artifacts/crypto-config/Org3MSP/peer0.org3.example.com/tls-msp/keystore/* /var/artifacts/crypto-config/Org3MSP/peer0.org3.example.com/tls-msp/keystore/key.pem


###########
# Orderer #
###########

# Copy certificate of ca.tls for OrdererOrg orderer0
mkdir -p /var/artifacts/crypto-config/OrdererMSP/orderer0.example.com/assets/tls-ca
cp /var/artifacts/crypto-config/TLS-CA/admin/msp/cacerts/0-0-0-0-5052.pem /var/artifacts/crypto-config/OrdererMSP/orderer0.example.com/assets/tls-ca/tls-ca-cert.pem

# Enroll for OrdererOrg orderer0
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/OrdererMSP/orderer0.example.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/OrdererMSP/orderer0.example.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer0.example.com:PCzEE5x2@0.0.0.0:5052 --enrollment.profile tls --csr.hosts orderer0.example.com,127.0.0.1

mv /var/artifacts/crypto-config/OrdererMSP/orderer0.example.com/tls-msp/keystore/* /var/artifacts/crypto-config/OrdererMSP/orderer0.example.com/tls-msp/keystore/key.pem

