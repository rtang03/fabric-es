# Copy TLS Cert
mkdir -p /var/artifacts/crypto-config/HsbcMSP/ca/crypto
cp /var/artifacts/crypto-config/HsbcMSP/ca/server/ca-cert.pem /var/artifacts/crypto-config/HsbcMSP/ca/crypto

# Register and Enroll
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/HsbcMSP/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/HsbcMSP/ca/admin
fabric-ca-client enroll -d -u https://rca-hsbc-admin:rca-hsbc-adminPW@0.0.0.0:5054
fabric-ca-client register -d --id.name peer0.hsbc.com.hk --id.secret 4PBPEkwt --id.type peer -u https://0.0.0.0:5054
fabric-ca-client register -d --id.name peer1.hsbc.com.hk --id.secret Q528SdnZ --id.type peer -u https://0.0.0.0:5054
fabric-ca-client register -d --id.name admin.hsbc.com.hk --id.secret mEN6bpQW --id.type admin --id.attrs "hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://0.0.0.0:5054

# Copy Trusted Root Cert of hsbc to peer0
mkdir -p /var/artifacts/crypto-config/HsbcMSP/peer0.hsbc.com.hk/assets/ca
cp /var/artifacts/crypto-config/HsbcMSP/ca/admin/msp/cacerts/0-0-0-0-5054.pem /var/artifacts/crypto-config/HsbcMSP/peer0.hsbc.com.hk/assets/ca/hsbc-ca-cert.pem

# Enroll peer0
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/HsbcMSP/peer0.hsbc.com.hk/assets/ca/hsbc-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/HsbcMSP/peer0.hsbc.com.hk
fabric-ca-client enroll -d -u https://peer0.hsbc.com.hk:4PBPEkwt@0.0.0.0:5054

# Copy Trusted Root Cert of hsbc to peer1
mkdir -p /var/artifacts/crypto-config/HsbcMSP/peer1.hsbc.com.hk/assets/ca
cp /var/artifacts/crypto-config/HsbcMSP/ca/admin/msp/cacerts/0-0-0-0-5054.pem /var/artifacts/crypto-config/HsbcMSP/peer1.hsbc.com.hk/assets/ca/hsbc-ca-cert.pem

# Enroll peer1
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/HsbcMSP/peer1.hsbc.com.hk/assets/ca/hsbc-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/HsbcMSP/peer1.hsbc.com.hk
fabric-ca-client enroll -d -u https://peer1.hsbc.com.hk:Q528SdnZ@0.0.0.0:5054

# Enroll hsbc's Admin
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/HsbcMSP/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/HsbcMSP/peer0.hsbc.com.hk/assets/ca/hsbc-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin.hsbc.com.hk:mEN6bpQW@0.0.0.0:5054

# Copy admin cert to peer0
mkdir -p /var/artifacts/crypto-config/HsbcMSP/peer0.hsbc.com.hk/msp/admincerts
cp /var/artifacts/crypto-config/HsbcMSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/HsbcMSP/peer0.hsbc.com.hk/msp/admincerts/hsbc-admin-cert.pem
# Copy admin cert to peer1
mkdir -p /var/artifacts/crypto-config/HsbcMSP/peer1.hsbc.com.hk/msp/admincerts
cp /var/artifacts/crypto-config/HsbcMSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/HsbcMSP/peer1.hsbc.com.hk/msp/admincerts/hsbc-admin-cert.pem

# Rename admin key
mv /var/artifacts/crypto-config/HsbcMSP/admin/msp/keystore/* /var/artifacts/crypto-config/HsbcMSP/admin/msp/keystore/key.pem
