# Copy TLS Cert
mkdir -p /var/artifacts/crypto-config/org2/ca/crypto
cp /var/artifacts/crypto-config/rca-org2/server/ca-cert.pem /var/artifacts/crypto-config/org2/ca/crypto

# Register and Enroll
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org2/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org2/ca/admin
fabric-ca-client enroll -d -u https://rca-org2-admin:rca-org2-adminPW@0.0.0.0:6055
fabric-ca-client register -d --id.name peer1-org2 --id.secret peer1PW --id.type peer -u https://0.0.0.0:6055
fabric-ca-client register -d --id.name peer2-org2 --id.secret peer2PW --id.type peer -u https://0.0.0.0:6055
fabric-ca-client register -d --id.name admin-org2 --id.secret org2AdminPW --id.type user -u https://0.0.0.0:6055
fabric-ca-client register -d --id.name user-org2 --id.secret org2UserPW --id.type user -u https://0.0.0.0:6055

# Copy Trusted Root Cert of org2 to peer1
mkdir -p /var/artifacts/crypto-config/org2/peer1/assets/ca
cp /var/artifacts/crypto-config/org2/ca/admin/msp/cacerts/0-0-0-0-6055.pem /var/artifacts/crypto-config/org2/peer1/assets/ca/org2-ca-cert.pem

# Enroll peer1
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org2/peer1/assets/ca/org2-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org2/peer1
fabric-ca-client enroll -d -u https://peer1-org2:peer1PW@0.0.0.0:6055

# Copy Trusted Root Cert of org2 to peer2
mkdir -p /var/artifacts/crypto-config/org2/peer2/assets/ca
cp /var/artifacts/crypto-config/org2/ca/admin/msp/cacerts/0-0-0-0-6055.pem /var/artifacts/crypto-config/org2/peer2/assets/ca/org2-ca-cert.pem

# Enroll peer2
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org2/peer2/assets/ca/org2-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org2/peer2
fabric-ca-client enroll -d -u https://peer2-org2:peer2PW@0.0.0.0:6055

# Enroll org2's Admin
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org2/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org2/peer1/assets/ca/org2-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin-org2:org2AdminPW@0.0.0.0:6055

# Copy admin cert to peer1
mkdir -p /var/artifacts/crypto-config/org2/peer1/msp/admincerts
cp /var/artifacts/crypto-config/org2/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/org2/peer1/msp/admincerts/org2-admin-cert.pem
# Copy admin cert to peer2
mkdir -p /var/artifacts/crypto-config/org2/peer2/msp/admincerts
cp /var/artifacts/crypto-config/org2/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/org2/peer2/msp/admincerts/org2-admin-cert.pem

# Rename admin key
mv /var/artifacts/crypto-config/org2/admin/msp/keystore/* /var/artifacts/crypto-config/org2/admin/msp/keystore/key.pem
