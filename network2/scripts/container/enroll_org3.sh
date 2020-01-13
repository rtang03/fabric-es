# Copy TLS Cert
mkdir -p /tmp/hyperledger/org3.neworg.com/ca/crypto
cp /tmp/hyperledger/rca.org3.neworg.com/crypto/ca-cert.pem /tmp/hyperledger/org3.neworg.com/ca/crypto

# Register and Enroll
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org3.neworg.com/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org3.neworg.com/ca/admin
fabric-ca-client enroll -d -u https://rca-org3-admin:rca-org3-adminPW@0.0.0.0:5056
fabric-ca-client register -d --id.name peer0.org3.neworg.com --id.secret peer0PW --id.type peer -u https://0.0.0.0:5056
fabric-ca-client register -d --id.name peer1.org3.neworg.com --id.secret peer1PW --id.type peer -u https://0.0.0.0:5056
fabric-ca-client register -d --id.name admin-org3.neworg.com --id.secret Org3MSPAdminPW --id.type admin --id.attrs "hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://0.0.0.0:5056

# Copy Trusted Root Cert of Org3MSP to peer0
mkdir -p /tmp/hyperledger/org3.neworg.com/peer0/assets/ca
cp /tmp/hyperledger/org3.neworg.com/ca/admin/msp/cacerts/0-0-0-0-5056.pem /tmp/hyperledger/org3.neworg.com/peer0/assets/ca/org3.neworg.com-ca-cert.pem

# Enroll peer0
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org3.neworg.com/peer0/assets/ca/org3.neworg.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org3.neworg.com/peer0
fabric-ca-client enroll -d -u https://peer0.org3.neworg.com:peer0PW@0.0.0.0:5056

# Copy Trusted Root Cert of Org3MSP to peer1
mkdir -p /tmp/hyperledger/org3.neworg.com/peer1/assets/ca
cp /tmp/hyperledger/org3.neworg.com/ca/admin/msp/cacerts/0-0-0-0-5056.pem /tmp/hyperledger/org3.neworg.com/peer1/assets/ca/org3.neworg.com-ca-cert.pem

# Enroll peer1
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org3.neworg.com/peer1/assets/ca/org3.neworg.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org3.neworg.com/peer1
fabric-ca-client enroll -d -u https://peer1.org3.neworg.com:peer1PW@0.0.0.0:5056

# Enroll Org3MSP's Admin
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org3.neworg.com/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org3.neworg.com/peer0/assets/ca/org3.neworg.com-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin-org3.neworg.com:Org3MSPAdminPW@0.0.0.0:5056

# Copy admin cert to peer0
mkdir -p /tmp/hyperledger/org3.neworg.com/peer0/msp/admincerts
cp /tmp/hyperledger/org3.neworg.com/admin/msp/signcerts/cert.pem /tmp/hyperledger/org3.neworg.com/peer0/msp/admincerts/org3.neworg.com-admin-cert.pem
# Copy admin cert to peer1
mkdir -p /tmp/hyperledger/org3.neworg.com/peer1/msp/admincerts
cp /tmp/hyperledger/org3.neworg.com/admin/msp/signcerts/cert.pem /tmp/hyperledger/org3.neworg.com/peer1/msp/admincerts/org3.neworg.com-admin-cert.pem

# Rename admin key
mv /tmp/hyperledger/org3.neworg.com/admin/msp/keystore/* /tmp/hyperledger/org3.neworg.com/admin/msp/keystore/key.pem
