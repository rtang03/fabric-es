# Copy TLS Cert
mkdir -p /var/artifacts/crypto-config/Org2MSP/ca/crypto
cp /var/artifacts/crypto-config/Org2MSP/ca/server/ca-cert.pem /var/artifacts/crypto-config/Org2MSP/ca/crypto

# Register and Enroll
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/Org2MSP/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/Org2MSP/ca/admin
fabric-ca-client enroll -d -u https://rca-org2-admin:rca-org2-adminPW@0.0.0.0:5055
fabric-ca-client register -d --id.name peer0.org2.net --id.secret 4PBPEkwt --id.type peer -u https://0.0.0.0:5055
fabric-ca-client register -d --id.name admin-org2.net --id.secret mEN6bpQW --id.type admin --id.attrs "hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://0.0.0.0:5055

# Copy Trusted Root Cert of org2 to peer0
mkdir -p /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/assets/ca
cp /var/artifacts/crypto-config/Org2MSP/ca/admin/msp/cacerts/0-0-0-0-5055.pem /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/assets/ca/org2.net-ca-cert.pem

# Enroll peer0
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/Org2MSP/peer0.org2.net/assets/ca/org2.net-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/Org2MSP/peer0.org2.net
fabric-ca-client enroll -d -u https://peer0.org2.net:4PBPEkwt@0.0.0.0:5055

# Enroll org2's Admin
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/Org2MSP/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/Org2MSP/peer0.org2.net/assets/ca/org2.net-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin-org2.net:mEN6bpQW@0.0.0.0:5055

# Copy admin cert to peer0
mkdir -p /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/msp/admincerts
cp /var/artifacts/crypto-config/Org2MSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/Org2MSP/peer0.org2.net/msp/admincerts/org2.net-admin-cert.pem

# Rename admin key
mv /var/artifacts/crypto-config/Org2MSP/admin/msp/keystore/* /var/artifacts/crypto-config/Org2MSP/admin/msp/keystore/key.pem
