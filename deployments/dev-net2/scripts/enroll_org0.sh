# Copy TLS Cert
mkdir -p /var/artifacts/crypto-config/Org0MSP/ca/crypto
cp /var/artifacts/crypto-config/Org0MSP/ca/server/ca-cert.pem /var/artifacts/crypto-config/Org0MSP/ca/crypto

# Enroll Orderer Org's CA Admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/Org0MSP/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/Org0MSP/ca/admin

fabric-ca-client enroll -d -u https://rca-org0-admin:rca-org0-adminPW@0.0.0.0:5053
fabric-ca-client register -d --id.name orderer0.org0.com --id.secret DPCxKv8m --id.type orderer -u https://0.0.0.0:5053
fabric-ca-client register -d --id.name admin-org0.com --id.secret sR7w9xWY --id.type admin --id.attrs "hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://0.0.0.0:5053

# Copy Trusted Root Cert of org0 orderer0
mkdir -p /var/artifacts/crypto-config/Org0MSP/orderer0.org0.com/assets/ca
cp /var/artifacts/crypto-config/Org0MSP/ca/admin/msp/cacerts/0-0-0-0-5053.pem /var/artifacts/crypto-config/Org0MSP/orderer0.org0.com/assets/ca/org0.com-ca-cert.pem

# Enroll orderer0
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/Org0MSP/orderer0.org0.com/assets/ca/org0.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/Org0MSP/orderer0.org0.com
fabric-ca-client enroll -d -u https://orderer0.org0.com:DPCxKv8m@0.0.0.0:5053

# Enroll Org0's Admin
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/Org0MSP/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/Org0MSP/orderer0.org0.com/assets/ca/org0.com-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin-org0.com:sR7w9xWY@0.0.0.0:5053

# Copy admin cert to the org0 orderer0
mkdir -p /var/artifacts/crypto-config/Org0MSP/orderer0.org0.com/msp/admincerts
cp /var/artifacts/crypto-config/Org0MSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/Org0MSP/orderer0.org0.com/msp/admincerts/org0.com-admin-cert.pem
