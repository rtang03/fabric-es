# Copy TLS Cert
mkdir -p /tmp/hyperledger/example.com/ca/crypto
cp /tmp/hyperledger/rca.example.com/crypto/ca-cert.pem /tmp/hyperledger/example.com/ca/crypto

# Enroll Orderer Org's CA Admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/example.com/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/example.com/ca/admin

fabric-ca-client enroll -d -u https://rca-org0-admin:rca-org0-adminPW@0.0.0.0:5053
fabric-ca-client register -d --id.name orderer1.example.com --id.secret ordererPW --id.type orderer -u https://0.0.0.0:5053
fabric-ca-client register -d --id.name orderer2.example.com --id.secret ordererPW --id.type orderer -u https://0.0.0.0:5053
fabric-ca-client register -d --id.name orderer3.example.com --id.secret ordererPW --id.type orderer -u https://0.0.0.0:5053
fabric-ca-client register -d --id.name orderer4.example.com --id.secret ordererPW --id.type orderer -u https://0.0.0.0:5053
fabric-ca-client register -d --id.name orderer5.example.com --id.secret ordererPW --id.type orderer -u https://0.0.0.0:5053
fabric-ca-client register -d --id.name admin-example.com --id.secret OrdererOrgAdminPW --id.type admin --id.attrs "hf.Registrar.Roles=client,hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://0.0.0.0:5053

# Copy Trusted Root Cert of OrdererOrg orderer1
mkdir -p /tmp/hyperledger/example.com/orderer1/assets/ca
cp /tmp/hyperledger/example.com/ca/admin/msp/cacerts/0-0-0-0-5053.pem /tmp/hyperledger/example.com/orderer1/assets/ca/example.com-ca-cert.pem
# Copy Trusted Root Cert of OrdererOrg orderer2
mkdir -p /tmp/hyperledger/example.com/orderer2/assets/ca
cp /tmp/hyperledger/example.com/ca/admin/msp/cacerts/0-0-0-0-5053.pem /tmp/hyperledger/example.com/orderer2/assets/ca/example.com-ca-cert.pem
# Copy Trusted Root Cert of OrdererOrg orderer3
mkdir -p /tmp/hyperledger/example.com/orderer3/assets/ca
cp /tmp/hyperledger/example.com/ca/admin/msp/cacerts/0-0-0-0-5053.pem /tmp/hyperledger/example.com/orderer3/assets/ca/example.com-ca-cert.pem
# Copy Trusted Root Cert of OrdererOrg orderer4
mkdir -p /tmp/hyperledger/example.com/orderer4/assets/ca
cp /tmp/hyperledger/example.com/ca/admin/msp/cacerts/0-0-0-0-5053.pem /tmp/hyperledger/example.com/orderer4/assets/ca/example.com-ca-cert.pem
# Copy Trusted Root Cert of OrdererOrg orderer5
mkdir -p /tmp/hyperledger/example.com/orderer5/assets/ca
cp /tmp/hyperledger/example.com/ca/admin/msp/cacerts/0-0-0-0-5053.pem /tmp/hyperledger/example.com/orderer5/assets/ca/example.com-ca-cert.pem

# Enroll orderer1
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/example.com/orderer1/assets/ca/example.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/example.com/orderer1
fabric-ca-client enroll -d -u https://orderer1.example.com:ordererPW@0.0.0.0:5053
# Enroll orderer2
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/example.com/orderer2/assets/ca/example.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/example.com/orderer2
fabric-ca-client enroll -d -u https://orderer2.example.com:ordererPW@0.0.0.0:5053
# Enroll orderer3
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/example.com/orderer3/assets/ca/example.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/example.com/orderer3
fabric-ca-client enroll -d -u https://orderer3.example.com:ordererPW@0.0.0.0:5053
# Enroll orderer4
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/example.com/orderer4/assets/ca/example.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/example.com/orderer4
fabric-ca-client enroll -d -u https://orderer4.example.com:ordererPW@0.0.0.0:5053
# Enroll orderer5
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/example.com/orderer5/assets/ca/example.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/example.com/orderer5
fabric-ca-client enroll -d -u https://orderer5.example.com:ordererPW@0.0.0.0:5053

# Enroll Org0's Admin
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/example.com/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/example.com/orderer1/assets/ca/example.com-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin-example.com:OrdererOrgAdminPW@0.0.0.0:5053

# Copy admin cert to the OrdererOrg orderer1
mkdir -p /tmp/hyperledger/example.com/orderer1/msp/admincerts
cp /tmp/hyperledger/example.com/admin/msp/signcerts/cert.pem /tmp/hyperledger/example.com/orderer1/msp/admincerts/example.com-admin-cert.pem

# Copy admin cert to the OrdererOrg orderer2
mkdir -p /tmp/hyperledger/example.com/orderer2/msp/admincerts
cp /tmp/hyperledger/example.com/admin/msp/signcerts/cert.pem /tmp/hyperledger/example.com/orderer2/msp/admincerts/example.com-admin-cert.pem

# Copy admin cert to the OrdererOrg orderer3
mkdir -p /tmp/hyperledger/example.com/orderer3/msp/admincerts
cp /tmp/hyperledger/example.com/admin/msp/signcerts/cert.pem /tmp/hyperledger/example.com/orderer3/msp/admincerts/example.com-admin-cert.pem

# Copy admin cert to the OrdererOrg orderer4
mkdir -p /tmp/hyperledger/example.com/orderer4/msp/admincerts
cp /tmp/hyperledger/example.com/admin/msp/signcerts/cert.pem /tmp/hyperledger/example.com/orderer4/msp/admincerts/example.com-admin-cert.pem

# Copy admin cert to the OrdererOrg orderer5
mkdir -p /tmp/hyperledger/example.com/orderer5/msp/admincerts
cp /tmp/hyperledger/example.com/admin/msp/signcerts/cert.pem /tmp/hyperledger/example.com/orderer5/msp/admincerts/example.com-admin-cert.pem

