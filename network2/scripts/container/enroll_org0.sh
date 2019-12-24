# Copy TLS Cert
mkdir -p /var/artifacts/crypto-config/org0/ca/crypto
cp /var/artifacts/crypto-config/rca-org0/server/ca-cert.pem /var/artifacts/crypto-config/org0/ca/crypto

# Enroll Orderer Org's CA Admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org0/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org0/ca/admin

fabric-ca-client enroll -d -u https://rca-org0-admin:rca-org0-adminPW@0.0.0.0:6053
fabric-ca-client register -d --id.name orderer1-org0 --id.secret ordererPW --id.type orderer -u https://0.0.0.0:6053
fabric-ca-client register -d --id.name orderer2-org0 --id.secret ordererPW --id.type orderer -u https://0.0.0.0:6053
fabric-ca-client register -d --id.name orderer3-org0 --id.secret ordererPW --id.type orderer -u https://0.0.0.0:6053
fabric-ca-client register -d --id.name orderer4-org0 --id.secret ordererPW --id.type orderer -u https://0.0.0.0:6053
fabric-ca-client register -d --id.name orderer5-org0 --id.secret ordererPW --id.type orderer -u https://0.0.0.0:6053
fabric-ca-client register -d --id.name admin-org0 --id.secret org0AdminPW --id.type admin --id.attrs "hf.Registrar.Roles=client,hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://0.0.0.0:6053

# Copy Trusted Root Cert of org0 orderer1
mkdir -p /var/artifacts/crypto-config/org0/orderer1/assets/ca
cp /var/artifacts/crypto-config/org0/ca/admin/msp/cacerts/0-0-0-0-6053.pem /var/artifacts/crypto-config/org0/orderer1/assets/ca/org0-ca-cert.pem
# Copy Trusted Root Cert of org0 orderer2
mkdir -p /var/artifacts/crypto-config/org0/orderer2/assets/ca
cp /var/artifacts/crypto-config/org0/ca/admin/msp/cacerts/0-0-0-0-6053.pem /var/artifacts/crypto-config/org0/orderer2/assets/ca/org0-ca-cert.pem
# Copy Trusted Root Cert of org0 orderer3
mkdir -p /var/artifacts/crypto-config/org0/orderer3/assets/ca
cp /var/artifacts/crypto-config/org0/ca/admin/msp/cacerts/0-0-0-0-6053.pem /var/artifacts/crypto-config/org0/orderer3/assets/ca/org0-ca-cert.pem
# Copy Trusted Root Cert of org0 orderer4
mkdir -p /var/artifacts/crypto-config/org0/orderer4/assets/ca
cp /var/artifacts/crypto-config/org0/ca/admin/msp/cacerts/0-0-0-0-6053.pem /var/artifacts/crypto-config/org0/orderer4/assets/ca/org0-ca-cert.pem
# Copy Trusted Root Cert of org0 orderer5
mkdir -p /var/artifacts/crypto-config/org0/orderer5/assets/ca
cp /var/artifacts/crypto-config/org0/ca/admin/msp/cacerts/0-0-0-0-6053.pem /var/artifacts/crypto-config/org0/orderer5/assets/ca/org0-ca-cert.pem

# Enroll orderer1
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org0/orderer1/assets/ca/org0-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org0/orderer1
fabric-ca-client enroll -d -u https://orderer1-org0:ordererPW@0.0.0.0:6053
# Enroll orderer2
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org0/orderer2/assets/ca/org0-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org0/orderer2
fabric-ca-client enroll -d -u https://orderer2-org0:ordererPW@0.0.0.0:6053
# Enroll orderer3
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org0/orderer3/assets/ca/org0-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org0/orderer3
fabric-ca-client enroll -d -u https://orderer3-org0:ordererPW@0.0.0.0:6053
# Enroll orderer4
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org0/orderer4/assets/ca/org0-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org0/orderer4
fabric-ca-client enroll -d -u https://orderer4-org0:ordererPW@0.0.0.0:6053
# Enroll orderer5
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org0/orderer5/assets/ca/org0-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org0/orderer5
fabric-ca-client enroll -d -u https://orderer5-org0:ordererPW@0.0.0.0:6053

# Enroll Org0's Admin
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/org0/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/org0/orderer1/assets/ca/org0-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin-org0:org0AdminPW@0.0.0.0:6053

# Copy admin cert to the org0 orderer1
mkdir -p /var/artifacts/crypto-config/org0/orderer1/msp/admincerts
cp /var/artifacts/crypto-config/org0/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/org0/orderer1/msp/admincerts/org0-admin-cert.pem

# Copy admin cert to the org0 orderer2
mkdir -p /var/artifacts/crypto-config/org0/orderer2/msp/admincerts
cp /var/artifacts/crypto-config/org0/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/org0/orderer2/msp/admincerts/org0-admin-cert.pem

# Copy admin cert to the org0 orderer3
mkdir -p /var/artifacts/crypto-config/org0/orderer3/msp/admincerts
cp /var/artifacts/crypto-config/org0/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/org0/orderer3/msp/admincerts/org0-admin-cert.pem

# Copy admin cert to the org0 orderer4
mkdir -p /var/artifacts/crypto-config/org0/orderer4/msp/admincerts
cp /var/artifacts/crypto-config/org0/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/org0/orderer4/msp/admincerts/org0-admin-cert.pem

# Copy admin cert to the org0 orderer5
mkdir -p /var/artifacts/crypto-config/org0/orderer5/msp/admincerts
cp /var/artifacts/crypto-config/org0/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/org0/orderer5/msp/admincerts/org0-admin-cert.pem

