# Copy TLS Cert
mkdir -p /var/artifacts/crypto-config/PbctfpMSP/ca/crypto
cp /var/artifacts/crypto-config/PbctfpMSP/ca/server/ca-cert.pem /var/artifacts/crypto-config/PbctfpMSP/ca/crypto

# Register and Enroll
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/PbctfpMSP/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/PbctfpMSP/ca/admin
fabric-ca-client enroll -d -u https://rca-pboc-admin:rca-pboc-adminPW@0.0.0.0:6055
fabric-ca-client register -d --id.name peer0.pbctfp.net --id.secret password --id.type peer -u https://0.0.0.0:6055
fabric-ca-client register -d --id.name peer1.pbctfp.net --id.secret password --id.type peer -u https://0.0.0.0:6055
fabric-ca-client register -d --id.name admin-pbctfp.net --id.secret password --id.type admin --id.attrs "hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://0.0.0.0:6055

# Copy Trusted Root Cert of pbctfp to peer0
mkdir -p /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/assets/ca
cp /var/artifacts/crypto-config/PbctfpMSP/ca/admin/msp/cacerts/0-0-0-0-6055.pem /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/assets/ca/pbctfp-ca-cert.pem

# Enroll peer0
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/assets/ca/pbctfp-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net
fabric-ca-client enroll -d -u https://peer0.pbctfp.net:password@0.0.0.0:6055

# Copy Trusted Root Cert of pbctfp to peer1
mkdir -p /var/artifacts/crypto-config/PbctfpMSP/peer1.pbctfp.net/assets/ca
cp /var/artifacts/crypto-config/PbctfpMSP/ca/admin/msp/cacerts/0-0-0-0-6055.pem /var/artifacts/crypto-config/PbctfpMSP/peer1.pbctfp.net/assets/ca/pbctfp-ca-cert.pem

# Enroll peer1
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/PbctfpMSP/peer1.pbctfp.net/assets/ca/pbctfp-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/PbctfpMSP/peer1.pbctfp.net
fabric-ca-client enroll -d -u https://peer1.pbctfp.net:password@0.0.0.0:6055

# Enroll pbctfp's Admin
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/PbctfpMSP/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/assets/ca/pbctfp-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin-pbctfp.net:password@0.0.0.0:6055

# Copy admin cert to peer0
mkdir -p /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/msp/admincerts
cp /var/artifacts/crypto-config/PbctfpMSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/msp/admincerts/pbctfp-admin-cert.pem
# Copy admin cert to peer1
mkdir -p /var/artifacts/crypto-config/PbctfpMSP/peer1.pbctfp.net/msp/admincerts
cp /var/artifacts/crypto-config/PbctfpMSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/PbctfpMSP/peer1.pbctfp.net/msp/admincerts/pbctfp-admin-cert.pem

# Rename admin key
mv /var/artifacts/crypto-config/PbctfpMSP/admin/msp/keystore/* /var/artifacts/crypto-config/PbctfpMSP/admin/msp/keystore/key.pem
