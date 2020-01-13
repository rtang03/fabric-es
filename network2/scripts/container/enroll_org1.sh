# Copy TLS Cert
mkdir -p /tmp/hyperledger/org1.example.com/ca/crypto
cp /tmp/hyperledger/rca.org1.example.com/crypto/ca-cert.pem /tmp/hyperledger/org1.example.com/ca/crypto

# Register and Enroll
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org1.example.com/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org1.example.com/ca/admin
fabric-ca-client enroll -d -u https://rca-org1-admin:rca-org1-adminPW@0.0.0.0:5054

fabric-ca-client register -d --id.name peer0.org1.example.com --id.secret peer0PW --id.type peer -u https://0.0.0.0:5054
fabric-ca-client register -d --id.name peer1.org1.example.com --id.secret peer1PW --id.type peer -u https://0.0.0.0:5054
fabric-ca-client register -d --id.name admin-org1.example.com --id.secret Org1MSPAdminPW --id.type admin --id.attrs "hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://0.0.0.0:5054

# Copy Trusted Root Cert of Org1MSP to peer0
mkdir -p /tmp/hyperledger/org1.example.com/peer0/assets/ca
cp /tmp/hyperledger/org1.example.com/ca/admin/msp/cacerts/0-0-0-0-5054.pem /tmp/hyperledger/org1.example.com/peer0/assets/ca/org1.example.com-ca-cert.pem

# Enroll peer0
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org1.example.com/peer0/assets/ca/org1.example.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org1.example.com/peer0
fabric-ca-client enroll -d -u https://peer0.org1.example.com:peer0PW@0.0.0.0:5054

# Copy Trusted Root Cert of Org1MSP to peer1
mkdir -p /tmp/hyperledger/org1.example.com/peer1/assets/ca
cp /tmp/hyperledger/org1.example.com/ca/admin/msp/cacerts/0-0-0-0-5054.pem /tmp/hyperledger/org1.example.com/peer1/assets/ca/org1.example.com-ca-cert.pem

# Enroll peer1
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org1.example.com/peer1/assets/ca/org1.example.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org1.example.com/peer1
fabric-ca-client enroll -d -u https://peer1.org1.example.com:peer1PW@0.0.0.0:5054

# Enroll Org1MSP's Admin
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/org1.example.com/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/org1.example.com/peer0/assets/ca/org1.example.com-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin-org1.example.com:Org1MSPAdminPW@0.0.0.0:5054

# Copy admin cert to peer0
mkdir -p /tmp/hyperledger/org1.example.com/peer0/msp/admincerts
cp /tmp/hyperledger/org1.example.com/admin/msp/signcerts/cert.pem /tmp/hyperledger/org1.example.com/peer0/msp/admincerts/org1.example.com-admin-cert.pem
# Copy admin cert to peer1
mkdir -p /tmp/hyperledger/org1.example.com/peer1/msp/admincerts
cp /tmp/hyperledger/org1.example.com/admin/msp/signcerts/cert.pem /tmp/hyperledger/org1.example.com/peer1/msp/admincerts/org1.example.com-admin-cert.pem

# Rename admin key
mv /tmp/hyperledger/org1.example.com/admin/msp/keystore/* /tmp/hyperledger/org1.example.com/admin/msp/keystore/key.pem
