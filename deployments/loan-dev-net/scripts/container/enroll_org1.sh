# Copy TLS Cert
mkdir -p /var/artifacts/crypto-config/Org1MSP/ca/crypto
cp /var/artifacts/crypto-config/Org1MSP/ca/server/ca-cert.pem /var/artifacts/crypto-config/Org1MSP/ca/crypto

# Register and Enroll
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/Org1MSP/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/Org1MSP/ca/admin
fabric-ca-client enroll -d -u https://rca-org1-admin:rca-org1-adminPW@0.0.0.0:5054
fabric-ca-client register -d --id.name peer0.org1.example.com --id.secret Tt4g3KLH --id.type peer -u https://0.0.0.0:5054
fabric-ca-client register -d --id.name admin-org1.example.com --id.secret Heym2rQK --id.type admin --id.attrs "hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://0.0.0.0:5054

# Copy Trusted Root Cert of Org1MSP to peer0
mkdir -p /var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com/assets/ca
cp /var/artifacts/crypto-config/Org1MSP/ca/admin/msp/cacerts/0-0-0-0-5054.pem /var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com/assets/ca/org1.example.com-ca-cert.pem

# Enroll peer0
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com/assets/ca/org1.example.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com
fabric-ca-client enroll -d -u https://peer0.org1.example.com:Tt4g3KLH@0.0.0.0:5054

# Enroll Org1MSP's Admin
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/Org1MSP/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com/assets/ca/org1.example.com-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin-org1.example.com:Heym2rQK@0.0.0.0:5054

# Copy admin cert to peer0
mkdir -p /var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com/msp/admincerts
cp /var/artifacts/crypto-config/Org1MSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/Org1MSP/peer0.org1.example.com/msp/admincerts/org1.example.com-admin-cert.pem

# Rename admin key
mv /var/artifacts/crypto-config/Org1MSP/admin/msp/keystore/* /var/artifacts/crypto-config/Org1MSP/admin/msp/keystore/key.pem
