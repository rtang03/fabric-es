# Copy TLS Cert
mkdir -p /var/artifacts/crypto-config/EtcMSP/ca/crypto
cp /var/artifacts/crypto-config/EtcMSP/ca/server/ca-cert.pem /var/artifacts/crypto-config/EtcMSP/ca/crypto

# Register and Enroll
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/EtcMSP/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/EtcMSP/ca/admin
fabric-ca-client enroll -d -u https://rca-etradeconnect-admin:rca-etradeconnect-adminPW@0.0.0.0:6054
fabric-ca-client register -d --id.name peer0.etradeconnect.net --id.secret Tt4g3KLH --id.type peer -u https://0.0.0.0:6054
fabric-ca-client register -d --id.name peer1.etradeconnect.net --id.secret C2npBNcf --id.type peer -u https://0.0.0.0:6054
fabric-ca-client register -d --id.name admin-etradeconnect.net --id.secret Heym2rQK --id.type admin --id.attrs "hf.Registrar.Attributes=*,hf.Revoker=true,hf.GenCRL=true,admin=true:ecert,abac.init=true:ecert" -u https://0.0.0.0:6054

# Copy Trusted Root Cert of etc to peer0
mkdir -p /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/ca
cp /var/artifacts/crypto-config/EtcMSP/ca/admin/msp/cacerts/0-0-0-0-6054.pem /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/ca/etradeconnect-ca-cert.pem

# Enroll peer0
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/ca/etradeconnect-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net
fabric-ca-client enroll -d -u https://peer0.etradeconnect.net:Tt4g3KLH@0.0.0.0:6054

# Copy Trusted Root Cert of etc to peer1
mkdir -p /var/artifacts/crypto-config/EtcMSP/peer1.etradeconnect.net/assets/ca
cp /var/artifacts/crypto-config/EtcMSP/ca/admin/msp/cacerts/0-0-0-0-6054.pem /var/artifacts/crypto-config/EtcMSP/peer1.etradeconnect.net/assets/ca/etradeconnect-ca-cert.pem

# Enroll peer1
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/EtcMSP/peer1.etradeconnect.net/assets/ca/etradeconnect-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/EtcMSP/peer1.etradeconnect.net
fabric-ca-client enroll -d -u https://peer1.etradeconnect.net:C2npBNcf@0.0.0.0:6054

# Enroll etc's Admin
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/EtcMSP/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/ca/etradeconnect-ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://admin-etradeconnect.net:Heym2rQK@0.0.0.0:6054

# Copy admin cert to peer0
mkdir -p /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/msp/admincerts
cp /var/artifacts/crypto-config/EtcMSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/msp/admincerts/etradeconnect-admin-cert.pem
# Copy admin cert to peer1
mkdir -p /var/artifacts/crypto-config/EtcMSP/peer1.etradeconnect.net/msp/admincerts
cp /var/artifacts/crypto-config/EtcMSP/admin/msp/signcerts/cert.pem /var/artifacts/crypto-config/EtcMSP/peer1.etradeconnect.net/msp/admincerts/etradeconnect-admin-cert.pem

# Rename admin key
mv /var/artifacts/crypto-config/EtcMSP/admin/msp/keystore/* /var/artifacts/crypto-config/EtcMSP/admin/msp/keystore/key.pem
