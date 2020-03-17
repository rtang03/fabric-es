# Copy TLS Cert
mkdir -p /var/artifacts/crypto-config/Org3MSP/ca/crypto
cp /var/artifacts/crypto-config/Org3MSP/ca/server/ca-cert.pem /var/artifacts/crypto-config/Org3MSP/ca/crypto

# Register and Enroll
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/Org3MSP/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/Org3MSP/ca/admin
fabric-ca-client enroll -d -u https://rca-org3-admin:rca-org3-adminPW@0.0.0.0:5056
fabric-ca-client register -d --id.name peer0.org3.net --id.secret 4PBPEkwt --id.type peer -u https://0.0.0.0:5056
fabric-ca-client register -d --id.name admin-org3.net --id.secret mEN6bpQW --id.type admin --id.attrs "hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://0.0.0.0:5056

# Copy Trusted Root Cert of org3 to peer0
mkdir -p /var/artifacts/crypto-config/Org3MSP/peer0.org3.net/assets/ca
cp /var/artifacts/crypto-config/Org3MSP/ca/admin/msp/cacerts/0-0-0-0-5056.pem /var/artifacts/crypto-config/Org3MSP/peer0.org3.net/assets/ca/org3.net-ca-cert.pem

# Enroll peer0
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/Org3MSP/peer0.org3.net/assets/ca/org3.net-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/Org3MSP/peer0.org3.net
fabric-ca-client enroll -d -u https://peer0.org3.net:4PBPEkwt@0.0.0.0:5056

# Enroll org3's Admin
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/Org3MSP/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/Org3MSP/peer0.org3.net/assets/ca/org3.net-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin-org3.net:mEN6bpQW@0.0.0.0:5056

# Copy admin cert to peer0
mkdir -p /var/artifacts/crypto-config/Org3MSP/peer0.org3.net/msp/admincerts
cp /var/artifacts/crypto-config/Org3MSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/Org3MSP/peer0.org3.net/msp/admincerts/org3.net-admin-cert.pem

# Rename admin key
mv /var/artifacts/crypto-config/Org3MSP/admin/msp/keystore/* /var/artifacts/crypto-config/Org3MSP/admin/msp/keystore/key.pem
