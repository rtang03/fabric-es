# Copy TLS Cert
mkdir -p /var/artifacts/crypto-config/HktfpMSP/ca/crypto
cp /var/artifacts/crypto-config/HktfpMSP/ca/server/ca-cert.pem /var/artifacts/crypto-config/HktfpMSP/ca/crypto

# Enroll Orderer Org's CA Admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/HktfpMSP/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/HktfpMSP/ca/admin

fabric-ca-client enroll -d -u https://rca-hktfp-admin:rca-hktfp-adminPW@0.0.0.0:6053
fabric-ca-client register -d --id.name orderer0.hktfp.com --id.secret DPCxKv8m --id.type orderer -u https://0.0.0.0:6053
fabric-ca-client register -d --id.name orderer1.hktfp.com --id.secret PCzEE5x2 --id.type orderer -u https://0.0.0.0:6053
fabric-ca-client register -d --id.name orderer2.hktfp.com --id.secret T2ZNRe8x --id.type orderer -u https://0.0.0.0:6053
fabric-ca-client register -d --id.name orderer3.hktfp.com --id.secret 7B5qMkhg --id.type orderer -u https://0.0.0.0:6053
fabric-ca-client register -d --id.name orderer4.hktfp.com --id.secret p8Maufjr --id.type orderer -u https://0.0.0.0:6053
fabric-ca-client register -d --id.name admin-hktfp.com --id.secret sR7w9xWY --id.type admin --id.attrs "hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://0.0.0.0:6053

# Copy Trusted Root Cert of hktfp orderer0
mkdir -p /var/artifacts/crypto-config/HktfpMSP/orderer0.hktfp.com/assets/ca
cp /var/artifacts/crypto-config/HktfpMSP/ca/admin/msp/cacerts/0-0-0-0-6053.pem /var/artifacts/crypto-config/HktfpMSP/orderer0.hktfp.com/assets/ca/hktfp.com-ca-cert.pem
# Copy Trusted Root Cert of hktfp orderer1
mkdir -p /var/artifacts/crypto-config/HktfpMSP/orderer1.hktfp.com/assets/ca
cp /var/artifacts/crypto-config/HktfpMSP/ca/admin/msp/cacerts/0-0-0-0-6053.pem /var/artifacts/crypto-config/HktfpMSP/orderer1.hktfp.com/assets/ca/hktfp.com-ca-cert.pem
# Copy Trusted Root Cert of hktfp orderer2
mkdir -p /var/artifacts/crypto-config/HktfpMSP/orderer2.hktfp.com/assets/ca
cp /var/artifacts/crypto-config/HktfpMSP/ca/admin/msp/cacerts/0-0-0-0-6053.pem /var/artifacts/crypto-config/HktfpMSP/orderer2.hktfp.com/assets/ca/hktfp.com-ca-cert.pem
# Copy Trusted Root Cert of hktfp orderer3
mkdir -p /var/artifacts/crypto-config/HktfpMSP/orderer3.hktfp.com/assets/ca
cp /var/artifacts/crypto-config/HktfpMSP/ca/admin/msp/cacerts/0-0-0-0-6053.pem /var/artifacts/crypto-config/HktfpMSP/orderer3.hktfp.com/assets/ca/hktfp.com-ca-cert.pem
# Copy Trusted Root Cert of hktfp orderer4
mkdir -p /var/artifacts/crypto-config/HktfpMSP/orderer4.hktfp.com/assets/ca
cp /var/artifacts/crypto-config/HktfpMSP/ca/admin/msp/cacerts/0-0-0-0-6053.pem /var/artifacts/crypto-config/HktfpMSP/orderer4.hktfp.com/assets/ca/hktfp.com-ca-cert.pem

# Enroll orderer0
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/HktfpMSP/orderer0.hktfp.com/assets/ca/hktfp.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/HktfpMSP/orderer0.hktfp.com
fabric-ca-client enroll -d -u https://orderer0.hktfp.com:DPCxKv8m@0.0.0.0:6053
# Enroll orderer1
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/HktfpMSP/orderer1.hktfp.com/assets/ca/hktfp.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/HktfpMSP/orderer1.hktfp.com
fabric-ca-client enroll -d -u https://orderer1.hktfp.com:PCzEE5x2@0.0.0.0:6053
# Enroll orderer2
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/HktfpMSP/orderer2.hktfp.com/assets/ca/hktfp.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/HktfpMSP/orderer2.hktfp.com
fabric-ca-client enroll -d -u https://orderer2.hktfp.com:T2ZNRe8x@0.0.0.0:6053
# Enroll orderer3
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/HktfpMSP/orderer3.hktfp.com/assets/ca/hktfp.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/HktfpMSP/orderer3.hktfp.com
fabric-ca-client enroll -d -u https://orderer3.hktfp.com:7B5qMkhg@0.0.0.0:6053
# Enroll orderer4
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/HktfpMSP/orderer4.hktfp.com/assets/ca/hktfp.com-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/HktfpMSP/orderer4.hktfp.com
fabric-ca-client enroll -d -u https://orderer4.hktfp.com:p8Maufjr@0.0.0.0:6053

# Enroll Org0's Admin
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/HktfpMSP/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/HktfpMSP/orderer0.hktfp.com/assets/ca/hktfp.com-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin-hktfp.com:sR7w9xWY@0.0.0.0:6053

# Copy admin cert to the hktfp orderer0
mkdir -p /var/artifacts/crypto-config/HktfpMSP/orderer0.hktfp.com/msp/admincerts
cp /var/artifacts/crypto-config/HktfpMSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/HktfpMSP/orderer0.hktfp.com/msp/admincerts/hktfp.com-admin-cert.pem

# Copy admin cert to the hktfp orderer1
mkdir -p /var/artifacts/crypto-config/HktfpMSP/orderer1.hktfp.com/msp/admincerts
cp /var/artifacts/crypto-config/HktfpMSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/HktfpMSP/orderer1.hktfp.com/msp/admincerts/hktfp.com-admin-cert.pem

# Copy admin cert to the hktfp orderer2
mkdir -p /var/artifacts/crypto-config/HktfpMSP/orderer2.hktfp.com/msp/admincerts
cp /var/artifacts/crypto-config/HktfpMSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/HktfpMSP/orderer2.hktfp.com/msp/admincerts/hktfp.com-admin-cert.pem

# Copy admin cert to the hktfp orderer3
mkdir -p /var/artifacts/crypto-config/HktfpMSP/orderer3.hktfp.com/msp/admincerts
cp /var/artifacts/crypto-config/HktfpMSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/HktfpMSP/orderer3.hktfp.com/msp/admincerts/hktfp.com-admin-cert.pem

# Copy admin cert to the hktfp orderer4
mkdir -p /var/artifacts/crypto-config/HktfpMSP/orderer4.hktfp.com/msp/admincerts
cp /var/artifacts/crypto-config/HktfpMSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/HktfpMSP/orderer4.hktfp.com/msp/admincerts/hktfp.com-admin-cert.pem

