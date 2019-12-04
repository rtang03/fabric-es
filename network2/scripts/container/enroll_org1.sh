# Copy TLS Cert
mkdir -p /var/artifacts/crypto-config/org1/ca/crypto
cp /var/artifacts/crypto-config/rca-org1/server/ca-cert.pem /var/artifacts/crypto-config/org1/ca/crypto

# Register and Enroll
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org1/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org1/ca/admin
fabric-ca-client enroll -d -u https://rca-org1-admin:rca-org1-adminPW@0.0.0.0:6054

fabric-ca-client register -d --id.name peer1-org1 --id.secret peer1PW --id.type peer -u https://0.0.0.0:6054
fabric-ca-client register -d --id.name peer2-org1 --id.secret peer2PW --id.type peer -u https://0.0.0.0:6054
fabric-ca-client register -d --id.name admin-org1 --id.secret org1AdminPW --id.type user -u https://0.0.0.0:6054
fabric-ca-client register -d --id.name user-org1 --id.secret org1UserPW --id.type user -u https://0.0.0.0:6054

# Copy Trusted Root Cert of org1 to peer1
mkdir -p /var/artifacts/crypto-config/org1/peer1/assets/ca
cp /var/artifacts/crypto-config/org1/ca/admin/msp/cacerts/0-0-0-0-6054.pem /var/artifacts/crypto-config/org1/peer1/assets/ca/org1-ca-cert.pem

# Enroll peer1
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org1/peer1/assets/ca/org1-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org1/peer1
fabric-ca-client enroll -d -u https://peer1-org1:peer1PW@0.0.0.0:6054

# Copy Trusted Root Cert of org1 to peer2
mkdir -p /var/artifacts/crypto-config/org1/peer2/assets/ca
cp /var/artifacts/crypto-config/org1/ca/admin/msp/cacerts/0-0-0-0-6054.pem /var/artifacts/crypto-config/org1/peer2/assets/ca/org1-ca-cert.pem

# Enroll peer2
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org1/peer2/assets/ca/org1-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org1/peer2
fabric-ca-client enroll -d -u https://peer2-org1:peer2PW@0.0.0.0:6054

# Enroll org1's Admin
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org1/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org1/peer1/assets/ca/org1-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin-org1:org1AdminPW@0.0.0.0:6054

# Copy admin cert to peer1
mkdir -p /var/artifacts/crypto-config/org1/peer1/msp/admincerts
cp /var/artifacts/crypto-config/org1/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/org1/peer1/msp/admincerts/org1-admin-cert.pem
# Copy admin cert to peer2
mkdir -p /var/artifacts/crypto-config/org1/peer2/msp/admincerts
cp /var/artifacts/crypto-config/org1/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/org1/peer2/msp/admincerts/org1-admin-cert.pem

# Rename admin key
mv /var/artifacts/crypto-config/org1/admin/msp/keystore/* /var/artifacts/crypto-config/org1/admin/msp/keystore/key.pem
