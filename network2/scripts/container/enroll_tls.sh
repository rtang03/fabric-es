
# Enroll ca-tls's Admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/ca-tls/server/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/ca-tls/admin

fabric-ca-client enroll -d -u https://tls-ca-admin:tls-ca-adminPW@0.0.0.0:6052
fabric-ca-client register -d --id.name peer1-org1 --id.secret peer1PW --id.type peer -u https://0.0.0.0:6052
fabric-ca-client register -d --id.name peer2-org1 --id.secret peer2PW --id.type peer -u https://0.0.0.0:6052
fabric-ca-client register -d --id.name peer1-org2 --id.secret peer1PW --id.type peer -u https://0.0.0.0:6052
fabric-ca-client register -d --id.name peer2-org2 --id.secret peer2PW --id.type peer -u https://0.0.0.0:6052
fabric-ca-client register -d --id.name orderer1-org0 --id.secret ordererPW --id.type orderer -u https://0.0.0.0:6052
fabric-ca-client register -d --id.name orderer2-org0 --id.secret ordererPW --id.type orderer -u https://0.0.0.0:6052
fabric-ca-client register -d --id.name orderer3-org0 --id.secret ordererPW --id.type orderer -u https://0.0.0.0:6052
fabric-ca-client register -d --id.name orderer4-org0 --id.secret ordererPW --id.type orderer -u https://0.0.0.0:6052
fabric-ca-client register -d --id.name orderer5-org0 --id.secret ordererPW --id.type orderer -u https://0.0.0.0:6052

#############
# org1 peer1#
#############

# Copy certificate of the TLS CA for org1 peer1
mkdir -p /var/artifacts/crypto-config/org1/peer1/assets/tls-ca
cp /var/artifacts/crypto-config/ca-tls/admin/msp/cacerts/0-0-0-0-6052.pem /var/artifacts/crypto-config/org1/peer1/assets/tls-ca/tls-ca-cert.pem

# Enroll org1 peer1
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org1/peer1
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org1/peer1/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer1-org1:peer1PW@0.0.0.0:6052 --enrollment.profile tls --csr.hosts peer1-org1

mv /var/artifacts/crypto-config/org1/peer1/tls-msp/keystore/* /var/artifacts/crypto-config/org1/peer1/tls-msp/keystore/key.pem

#############
# org1 peer2#
#############

# Copy certificate of the TLS CA for org1 peer2
mkdir -p /var/artifacts/crypto-config/org1/peer2/assets/tls-ca
cp /var/artifacts/crypto-config/ca-tls/admin/msp/cacerts/0-0-0-0-6052.pem /var/artifacts/crypto-config/org1/peer2/assets/tls-ca/tls-ca-cert.pem

# Enroll org1 peer2
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org1/peer2
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org1/peer2/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer2-org1:peer2PW@0.0.0.0:6052 --enrollment.profile tls --csr.hosts peer2-org1

mv /var/artifacts/crypto-config/org1/peer2/tls-msp/keystore/* /var/artifacts/crypto-config/org1/peer2/tls-msp/keystore/key.pem

#############
# org2 peer1#
#############

# Copy certificate of the TLS CA for org2 peer1
mkdir -p /var/artifacts/crypto-config/org2/peer1/assets/tls-ca
cp /var/artifacts/crypto-config/ca-tls/admin/msp/cacerts/0-0-0-0-6052.pem /var/artifacts/crypto-config/org2/peer1/assets/tls-ca/tls-ca-cert.pem

# Enroll org2 peer1
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org2/peer1
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org2/peer1/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer1-org2:peer1PW@0.0.0.0:6052 --enrollment.profile tls --csr.hosts peer1-org2

mv /var/artifacts/crypto-config/org2/peer1/tls-msp/keystore/* /var/artifacts/crypto-config/org2/peer1/tls-msp/keystore/key.pem

#############
# org2 peer2#
#############

# Copy certificate of the TLS CA for org2 peer2
mkdir -p /var/artifacts/crypto-config/org2/peer2/assets/tls-ca
cp /var/artifacts/crypto-config/ca-tls/admin/msp/cacerts/0-0-0-0-6052.pem /var/artifacts/crypto-config/org2/peer2/assets/tls-ca/tls-ca-cert.pem

# Enroll org2 peer2
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org2/peer2
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org2/peer2/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer2-org2:peer2PW@0.0.0.0:6052 --enrollment.profile tls --csr.hosts peer2-org2

mv /var/artifacts/crypto-config/org2/peer2/tls-msp/keystore/* /var/artifacts/crypto-config/org2/peer2/tls-msp/keystore/key.pem


###########
# Orderer #
###########

# Copy certificate of ca-tls for org0 orderer1
mkdir -p /var/artifacts/crypto-config/org0/orderer1/assets/tls-ca
cp /var/artifacts/crypto-config/ca-tls/admin/msp/cacerts/0-0-0-0-6052.pem /var/artifacts/crypto-config/org0/orderer1/assets/tls-ca/tls-ca-cert.pem

# Enroll for org0 orderer1
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org0/orderer1
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org0/orderer1/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer1-org0:ordererPW@0.0.0.0:6052 --enrollment.profile tls --csr.hosts orderer1-org0

mv /var/artifacts/crypto-config/org0/orderer1/tls-msp/keystore/* /var/artifacts/crypto-config/org0/orderer1/tls-msp/keystore/key.pem

# Copy certificate of ca-tls for org0 orderer2
mkdir -p /var/artifacts/crypto-config/org0/orderer2/assets/tls-ca
cp /var/artifacts/crypto-config/ca-tls/admin/msp/cacerts/0-0-0-0-6052.pem /var/artifacts/crypto-config/org0/orderer2/assets/tls-ca/tls-ca-cert.pem

# Enroll for org0 orderer2
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org0/orderer2
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org0/orderer2/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer2-org0:ordererPW@0.0.0.0:6052 --enrollment.profile tls --csr.hosts orderer2-org0

mv /var/artifacts/crypto-config/org0/orderer2/tls-msp/keystore/* /var/artifacts/crypto-config/org0/orderer2/tls-msp/keystore/key.pem

# Copy certificate of ca-tls for org0 orderer3
mkdir -p /var/artifacts/crypto-config/org0/orderer3/assets/tls-ca
cp /var/artifacts/crypto-config/ca-tls/admin/msp/cacerts/0-0-0-0-6052.pem /var/artifacts/crypto-config/org0/orderer3/assets/tls-ca/tls-ca-cert.pem

# Enroll for org0 orderer3
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org0/orderer3
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org0/orderer3/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer3-org0:ordererPW@0.0.0.0:6052 --enrollment.profile tls --csr.hosts orderer3-org0

mv /var/artifacts/crypto-config/org0/orderer3/tls-msp/keystore/* /var/artifacts/crypto-config/org0/orderer3/tls-msp/keystore/key.pem

# Copy certificate of ca-tls for org0 orderer4
mkdir -p /var/artifacts/crypto-config/org0/orderer4/assets/tls-ca
cp /var/artifacts/crypto-config/ca-tls/admin/msp/cacerts/0-0-0-0-6052.pem /var/artifacts/crypto-config/org0/orderer4/assets/tls-ca/tls-ca-cert.pem

# Enroll for org0 orderer4
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org0/orderer4
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org0/orderer4/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer4-org0:ordererPW@0.0.0.0:6052 --enrollment.profile tls --csr.hosts orderer4-org0

mv /var/artifacts/crypto-config/org0/orderer4/tls-msp/keystore/* /var/artifacts/crypto-config/org0/orderer4/tls-msp/keystore/key.pem

# Copy certificate of ca-tls for org0 orderer5
mkdir -p /var/artifacts/crypto-config/org0/orderer5/assets/tls-ca
cp /var/artifacts/crypto-config/ca-tls/admin/msp/cacerts/0-0-0-0-6052.pem /var/artifacts/crypto-config/org0/orderer5/assets/tls-ca/tls-ca-cert.pem

# Enroll for org0 orderer5
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org0/orderer5
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org0/orderer5/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer5-org0:ordererPW@0.0.0.0:6052 --enrollment.profile tls --csr.hosts orderer5-org0

mv /var/artifacts/crypto-config/org0/orderer5/tls-msp/keystore/* /var/artifacts/crypto-config/org0/orderer5/tls-msp/keystore/key.pem

