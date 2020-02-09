# Copy TLS Cert
mkdir -p /tmp/hyperledger/Org3MSP/ca/crypto
cp /tmp/hyperledger/Org3MSP/ca/server/ca-cert.pem /tmp/hyperledger/Org3MSP/ca/crypto

# Register and Enroll
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/Org3MSP/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/Org3MSP/ca/admin
fabric-ca-client enroll -d -u https://rca-org3-admin:rca-org3-adminPW@0.0.0.0:5056
fabric-ca-client register -d --id.name peer0.org3.neworg.com --id.secret 4PBPEkwt --id.type peer -u https://0.0.0.0:5056
fabric-ca-client register -d --id.name peer1.org3.neworg.com --id.secret Q528SdnZ --id.type peer -u https://0.0.0.0:5056
fabric-ca-client register -d --id.name admin-org3.neworg.com --id.secret mEN6bpQW --id.type admin --id.attrs "hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://0.0.0.0:5056

# Copy Trusted Root Cert of Org3MSP to peer0
mkdir -p /tmp/hyperledger/Org3MSP/peer0.org3.neworg.com/assets/ca
cp /tmp/hyperledger/Org3MSP/ca/admin/msp/cacerts/0-0-0-0-5056.pem /tmp/hyperledger/Org3MSP/peer0.org3.neworg.com/assets/ca/org3.neworg.com-ca-cert.pem

# Enroll peer0
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/Org3MSP/peer0.org3.neworg.com/assets/ca/org3.neworg.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/Org3MSP/peer0.org3.neworg.com
fabric-ca-client enroll -d -u https://peer0.org3.neworg.com:4PBPEkwt@0.0.0.0:5056

# Copy Trusted Root Cert of Org3MSP to peer1
mkdir -p /tmp/hyperledger/Org3MSP/peer1.org3.neworg.com/assets/ca
cp /tmp/hyperledger/Org3MSP/ca/admin/msp/cacerts/0-0-0-0-5056.pem /tmp/hyperledger/Org3MSP/peer1.org3.neworg.com/assets/ca/org3.neworg.com-ca-cert.pem

# Enroll peer1
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/Org3MSP/peer1.org3.neworg.com/assets/ca/org3.neworg.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/Org3MSP/peer1.org3.neworg.com
fabric-ca-client enroll -d -u https://peer1.org3.neworg.com:Q528SdnZ@0.0.0.0:5056

# Enroll Org3MSP's Admin
export FABRIC_CA_CLIENT_HOME=/tmp/hyperledger/Org3MSP/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/tmp/hyperledger/Org3MSP/peer0.org3.neworg.com/assets/ca/org3.neworg.com-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin-org3.neworg.com:mEN6bpQW@0.0.0.0:5056

# Copy admin cert to peer0
mkdir -p /tmp/hyperledger/Org3MSP/peer0.org3.neworg.com/msp/admincerts
cp /tmp/hyperledger/Org3MSP/admin/msp/signcerts/cert.pem /tmp/hyperledger/Org3MSP/peer0.org3.neworg.com/msp/admincerts/org3.neworg.com-admin-cert.pem
# Copy admin cert to peer1
mkdir -p /tmp/hyperledger/Org3MSP/peer1.org3.neworg.com/msp/admincerts
cp /tmp/hyperledger/Org3MSP/admin/msp/signcerts/cert.pem /tmp/hyperledger/Org3MSP/peer1.org3.neworg.com/msp/admincerts/org3.neworg.com-admin-cert.pem

# Rename admin key
mv /tmp/hyperledger/Org3MSP/admin/msp/keystore/* /tmp/hyperledger/Org3MSP/admin/msp/keystore/key.pem
