# Copy TLS Cert
mkdir -p /tmp/hyperledger/org2.example.com/ca/crypto
cp /tmp/hyperledger/rca.org2.example.com/crypto/ca-cert.pem /tmp/hyperledger/org2.example.com/ca/crypto

# Register and Enroll
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org2.example.com/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org2.example.com/ca/admin
fabric-ca-client enroll -d -u https://rca-org2-admin:rca-org2-adminPW@0.0.0.0:5055
fabric-ca-client register -d --id.name peer0.org2.example.com --id.secret peer0PW --id.type peer -u https://0.0.0.0:5055
fabric-ca-client register -d --id.name peer1.org2.example.com --id.secret peer1PW --id.type peer -u https://0.0.0.0:5055
fabric-ca-client register -d --id.name admin-org2.example.com --id.secret Org2MSPAdminPW --id.type admin --id.attrs "hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://0.0.0.0:5055

# Copy Trusted Root Cert of Org2MSP to peer0
mkdir -p /tmp/hyperledger/org2.example.com/peer0/assets/ca
cp /tmp/hyperledger/org2.example.com/ca/admin/msp/cacerts/0-0-0-0-5055.pem /tmp/hyperledger/org2.example.com/peer0/assets/ca/org2.example.com-ca-cert.pem

# Enroll peer0
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org2.example.com/peer0/assets/ca/org2.example.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org2.example.com/peer0
fabric-ca-client enroll -d -u https://peer0.org2.example.com:peer0PW@0.0.0.0:5055

# Copy Trusted Root Cert of Org2MSP to peer1
mkdir -p /tmp/hyperledger/org2.example.com/peer1/assets/ca
cp /tmp/hyperledger/org2.example.com/ca/admin/msp/cacerts/0-0-0-0-5055.pem /tmp/hyperledger/org2.example.com/peer1/assets/ca/org2.example.com-ca-cert.pem

# Enroll peer1
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org2.example.com/peer1/assets/ca/org2.example.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org2.example.com/peer1
fabric-ca-client enroll -d -u https://peer1.org2.example.com:peer1PW@0.0.0.0:5055

# Enroll Org2MSP's Admin
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org2.example.com/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org2.example.com/peer0/assets/ca/org2.example.com-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin-org2.example.com:Org2MSPAdminPW@0.0.0.0:5055

# Copy admin cert to peer0
mkdir -p /tmp/hyperledger/org2.example.com/peer0/msp/admincerts
cp /tmp/hyperledger/org2.example.com/admin/msp/signcerts/cert.pem /tmp/hyperledger/org2.example.com/peer0/msp/admincerts/org2.example.com-admin-cert.pem
# Copy admin cert to peer1
mkdir -p /tmp/hyperledger/org2.example.com/peer1/msp/admincerts
cp /tmp/hyperledger/org2.example.com/admin/msp/signcerts/cert.pem /tmp/hyperledger/org2.example.com/peer1/msp/admincerts/org2.example.com-admin-cert.pem

# Rename admin key
mv /tmp/hyperledger/org2.example.com/admin/msp/keystore/* /tmp/hyperledger/org2.example.com/admin/msp/keystore/key.pem
