# Copy TLS Cert
mkdir -p /var/artifacts/crypto-config/OrdererMSP/ca/crypto
cp /var/artifacts/crypto-config/OrdererMSP/ca/server/ca-cert.pem /var/artifacts/crypto-config/OrdererMSP/ca/crypto

# Enroll Orderer Org's CA Admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/OrdererMSP/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/OrdererMSP/ca/admin

fabric-ca-client enroll -d -u https://rca-org0-admin:rca-org0-adminPW@0.0.0.0:5053
fabric-ca-client register -d --id.name orderer0.example.com --id.secret DPCxKv8m --id.type orderer -u https://0.0.0.0:5053
fabric-ca-client register -d --id.name admin-example.com --id.secret sR7w9xWY --id.type admin --id.attrs "hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://0.0.0.0:5053

# Copy Trusted Root Cert of OrdererOrg orderer0
mkdir -p /var/artifacts/crypto-config/OrdererMSP/orderer0.example.com/assets/ca
cp /var/artifacts/crypto-config/OrdererMSP/ca/admin/msp/cacerts/0-0-0-0-5053.pem /var/artifacts/crypto-config/OrdererMSP/orderer0.example.com/assets/ca/example.com-ca-cert.pem

# Enroll orderer0
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/OrdererMSP/orderer0.example.com/assets/ca/example.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/OrdererMSP/orderer0.example.com
fabric-ca-client enroll -d -u https://orderer0.example.com:DPCxKv8m@0.0.0.0:5053

# Enroll Org0's Admin
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/OrdererMSP/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/OrdererMSP/orderer0.example.com/assets/ca/example.com-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin-example.com:sR7w9xWY@0.0.0.0:5053

# Copy admin cert to the OrdererOrg orderer0
mkdir -p /var/artifacts/crypto-config/OrdererMSP/orderer0.example.com/msp/admincerts
cp /var/artifacts/crypto-config/OrdererMSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/OrdererMSP/orderer0.example.com/msp/admincerts/example.com-admin-cert.pem

