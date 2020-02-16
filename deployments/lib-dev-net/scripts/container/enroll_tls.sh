
# Enroll tls-ca-hktfp's Admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/HktfpMSP/tls/server/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/HktfpMSP/tls/admin

fabric-ca-client enroll -d -u https://tls-ca-admin:tls-ca-adminPW@0.0.0.0:6052
fabric-ca-client register -d --id.name peer0.etradeconnect.net --id.secret password --id.type peer -u https://0.0.0.0:6052
fabric-ca-client register -d --id.name peer1.etradeconnect.net --id.secret password --id.type peer -u https://0.0.0.0:6052
fabric-ca-client register -d --id.name peer0.pbctfp.net --id.secret password --id.type peer -u https://0.0.0.0:6052
fabric-ca-client register -d --id.name peer1.pbctfp.net --id.secret password --id.type peer -u https://0.0.0.0:6052
fabric-ca-client register -d --id.name peer0.hsbc.com.hk --id.secret password --id.type peer -u https://0.0.0.0:6052
fabric-ca-client register -d --id.name peer1.hsbc.com.hk --id.secret password --id.type peer -u https://0.0.0.0:6052
fabric-ca-client register -d --id.name orderer0.hktfp.com --id.secret password --id.type orderer -u https://0.0.0.0:6052
fabric-ca-client register -d --id.name orderer1.hktfp.com --id.secret password --id.type orderer -u https://0.0.0.0:6052
fabric-ca-client register -d --id.name orderer2.hktfp.com --id.secret password --id.type orderer -u https://0.0.0.0:6052
fabric-ca-client register -d --id.name orderer3.hktfp.com --id.secret password --id.type orderer -u https://0.0.0.0:6052
fabric-ca-client register -d --id.name orderer4.hktfp.com --id.secret password --id.type orderer -u https://0.0.0.0:6052

#############
# etc peer0#
#############

# Copy certificate of the TLS CA for etc peer0
mkdir -p /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/tls-ca
cp /var/artifacts/crypto-config/HktfpMSP/tls/admin/msp/cacerts/0-0-0-0-6052.pem /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/tls-ca/tls-ca-cert.pem

# Enroll etc peer0
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer0.etradeconnect.net:password@0.0.0.0:6052 --enrollment.profile tls --csr.hosts peer0-etradeconnect,127.0.0.1

mv /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/keystore/* /var/artifacts/crypto-config/EtcMSP/peer0.etradeconnect.net/tls-msp/keystore/key.pem

#############
# etc peer1#
#############

# Copy certificate of the TLS CA for etc peer1
mkdir -p /var/artifacts/crypto-config/EtcMSP/peer1.etradeconnect.net/assets/tls-ca
cp /var/artifacts/crypto-config/HktfpMSP/tls/admin/msp/cacerts/0-0-0-0-6052.pem /var/artifacts/crypto-config/EtcMSP/peer1.etradeconnect.net/assets/tls-ca/tls-ca-cert.pem

# Enroll etc peer1
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/EtcMSP/peer1.etradeconnect.net
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/EtcMSP/peer1.etradeconnect.net/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer1.etradeconnect.net:password@0.0.0.0:6052 --enrollment.profile tls --csr.hosts peer1-etradeconnect,127.0.0.1

mv /var/artifacts/crypto-config/EtcMSP/peer1.etradeconnect.net/tls-msp/keystore/* /var/artifacts/crypto-config/EtcMSP/peer1.etradeconnect.net/tls-msp/keystore/key.pem

#############
# pbctfp peer0#
#############

# Copy certificate of the TLS CA for pbctfp peer0
mkdir -p /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/assets/tls-ca
cp /var/artifacts/crypto-config/HktfpMSP/tls/admin/msp/cacerts/0-0-0-0-6052.pem /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/assets/tls-ca/tls-ca-cert.pem

# Enroll pbctfp peer0
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer0.pbctfp.net:password@0.0.0.0:6052 --enrollment.profile tls --csr.hosts peer0-pbctfp,127.0.0.1

mv /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/tls-msp/keystore/* /var/artifacts/crypto-config/PbctfpMSP/peer0.pbctfp.net/tls-msp/keystore/key.pem

#############
# pbctfp peer1#
#############

# Copy certificate of the TLS CA for pbctfp peer1
mkdir -p /var/artifacts/crypto-config/PbctfpMSP/peer1.pbctfp.net/assets/tls-ca
cp /var/artifacts/crypto-config/HktfpMSP/tls/admin/msp/cacerts/0-0-0-0-6052.pem /var/artifacts/crypto-config/PbctfpMSP/peer1.pbctfp.net/assets/tls-ca/tls-ca-cert.pem

# Enroll pbctfp peer1
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/PbctfpMSP/peer1.pbctfp.net
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/PbctfpMSP/peer1.pbctfp.net/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer1.pbctfp.net:password@0.0.0.0:6052 --enrollment.profile tls --csr.hosts peer1-pbctfp,127.0.0.1

mv /var/artifacts/crypto-config/PbctfpMSP/peer1.pbctfp.net/tls-msp/keystore/* /var/artifacts/crypto-config/PbctfpMSP/peer1.pbctfp.net/tls-msp/keystore/key.pem

#############
# hsbc peer0#
#############

# Copy certificate of the TLS CA for hsbc peer0
mkdir -p /var/artifacts/crypto-config/HsbcMSP/peer0.hsbc.com.hk/assets/tls-ca
cp /var/artifacts/crypto-config/HktfpMSP/tls/admin/msp/cacerts/0-0-0-0-6052.pem /var/artifacts/crypto-config/HsbcMSP/peer0.hsbc.com.hk/assets/tls-ca/tls-ca-cert.pem

# Enroll hsbc peer0
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/HsbcMSP/peer0.hsbc.com.hk
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/HsbcMSP/peer0.hsbc.com.hk/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer0.hsbc.com.hk:password@0.0.0.0:6052 --enrollment.profile tls --csr.hosts peer0-hsbc,127.0.0.1

mv /var/artifacts/crypto-config/HsbcMSP/peer0.hsbc.com.hk/tls-msp/keystore/* /var/artifacts/crypto-config/HsbcMSP/peer0.hsbc.com.hk/tls-msp/keystore/key.pem

#############
# hsbc peer1#
#############

# Copy certificate of the TLS CA for hsbc peer1
mkdir -p /var/artifacts/crypto-config/HsbcMSP/peer1.hsbc.com.hk/assets/tls-ca
cp /var/artifacts/crypto-config/HktfpMSP/tls/admin/msp/cacerts/0-0-0-0-6052.pem /var/artifacts/crypto-config/HsbcMSP/peer1.hsbc.com.hk/assets/tls-ca/tls-ca-cert.pem

# Enroll hsbc peer1
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/HsbcMSP/peer1.hsbc.com.hk
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/HsbcMSP/peer1.hsbc.com.hk/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer1.hsbc.com.hk:password@0.0.0.0:6052 --enrollment.profile tls --csr.hosts peer1-hsbc,127.0.0.1

mv /var/artifacts/crypto-config/HsbcMSP/peer1.hsbc.com.hk/tls-msp/keystore/* /var/artifacts/crypto-config/HsbcMSP/peer1.hsbc.com.hk/tls-msp/keystore/key.pem


###########
# Orderer #
###########

# Copy certificate of tls-ca-hktfp for hktfp orderer0
mkdir -p /var/artifacts/crypto-config/HktfpMSP/orderer0.hktfp.com/assets/tls-ca
cp /var/artifacts/crypto-config/HktfpMSP/tls/admin/msp/cacerts/0-0-0-0-6052.pem /var/artifacts/crypto-config/HktfpMSP/orderer0.hktfp.com/assets/tls-ca/tls-ca-cert.pem

# Enroll for hktfp orderer0
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/HktfpMSP/orderer0.hktfp.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/HktfpMSP/orderer0.hktfp.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer0.hktfp.com:password@0.0.0.0:6052 --enrollment.profile tls --csr.hosts orderer0-hktfp,127.0.0.1

mv /var/artifacts/crypto-config/HktfpMSP/orderer0.hktfp.com/tls-msp/keystore/* /var/artifacts/crypto-config/HktfpMSP/orderer0.hktfp.com/tls-msp/keystore/key.pem

# Copy certificate of tls-ca-hktfp for hktfp orderer1
mkdir -p /var/artifacts/crypto-config/HktfpMSP/orderer1.hktfp.com/assets/tls-ca
cp /var/artifacts/crypto-config/HktfpMSP/tls/admin/msp/cacerts/0-0-0-0-6052.pem /var/artifacts/crypto-config/HktfpMSP/orderer1.hktfp.com/assets/tls-ca/tls-ca-cert.pem

# Enroll for hktfp orderer1
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/HktfpMSP/orderer1.hktfp.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/HktfpMSP/orderer1.hktfp.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer1.hktfp.com:password@0.0.0.0:6052 --enrollment.profile tls --csr.hosts orderer1-hktfp,127.0.0.1

mv /var/artifacts/crypto-config/HktfpMSP/orderer1.hktfp.com/tls-msp/keystore/* /var/artifacts/crypto-config/HktfpMSP/orderer1.hktfp.com/tls-msp/keystore/key.pem

# Copy certificate of tls-ca-hktfp for hktfp orderer2
mkdir -p /var/artifacts/crypto-config/HktfpMSP/orderer2.hktfp.com/assets/tls-ca
cp /var/artifacts/crypto-config/HktfpMSP/tls/admin/msp/cacerts/0-0-0-0-6052.pem /var/artifacts/crypto-config/HktfpMSP/orderer2.hktfp.com/assets/tls-ca/tls-ca-cert.pem

# Enroll for hktfp orderer2
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/HktfpMSP/orderer2.hktfp.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/HktfpMSP/orderer2.hktfp.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer2.hktfp.com:password@0.0.0.0:6052 --enrollment.profile tls --csr.hosts orderer2-hktfp,127.0.0.1

mv /var/artifacts/crypto-config/HktfpMSP/orderer2.hktfp.com/tls-msp/keystore/* /var/artifacts/crypto-config/HktfpMSP/orderer2.hktfp.com/tls-msp/keystore/key.pem

# Copy certificate of tls-ca-hktfp for hktfp orderer3
mkdir -p /var/artifacts/crypto-config/HktfpMSP/orderer3.hktfp.com/assets/tls-ca
cp /var/artifacts/crypto-config/HktfpMSP/tls/admin/msp/cacerts/0-0-0-0-6052.pem /var/artifacts/crypto-config/HktfpMSP/orderer3.hktfp.com/assets/tls-ca/tls-ca-cert.pem

# Enroll for hktfp orderer3
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/HktfpMSP/orderer3.hktfp.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/HktfpMSP/orderer3.hktfp.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer3.hktfp.com:password@0.0.0.0:6052 --enrollment.profile tls --csr.hosts orderer3-hktfp,127.0.0.1

mv /var/artifacts/crypto-config/HktfpMSP/orderer3.hktfp.com/tls-msp/keystore/* /var/artifacts/crypto-config/HktfpMSP/orderer3.hktfp.com/tls-msp/keystore/key.pem

# Copy certificate of tls-ca-hktfp for hktfp orderer4
mkdir -p /var/artifacts/crypto-config/HktfpMSP/orderer4.hktfp.com/assets/tls-ca
cp /var/artifacts/crypto-config/HktfpMSP/tls/admin/msp/cacerts/0-0-0-0-6052.pem /var/artifacts/crypto-config/HktfpMSP/orderer4.hktfp.com/assets/tls-ca/tls-ca-cert.pem

# Enroll for hktfp orderer4
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_HOME=/var/artifacts/crypto-config/HktfpMSP/orderer4.hktfp.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=/var/artifacts/crypto-config/HktfpMSP/orderer4.hktfp.com/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer4.hktfp.com:password@0.0.0.0:6052 --enrollment.profile tls --csr.hosts orderer4-hktfp,127.0.0.1

mv /var/artifacts/crypto-config/HktfpMSP/orderer4.hktfp.com/tls-msp/keystore/* /var/artifacts/crypto-config/HktfpMSP/orderer4.hktfp.com/tls-msp/keystore/key.pem

