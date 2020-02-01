#!/bin/bash

export CURRENT_DIR=$PWD/hosts

# SETUP TLS
# create directory for tls-ca client
mkdir -p $CURRENT_DIR/tls-ca/crypto
cp $CURRENT_DIR/tls/ca/crypto/ca-cert.pem $CURRENT_DIR/tls-ca/crypto/tls-ca-cert.pem

# Enroel tls-ca admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/tls/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/tls-ca/admin
fabric-ca-client enroll -d -u https://tls-ca-admin:tls-ca-adminpw@0.0.0.0:5052

# Enrol tls for orderer and peer
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/tls-ca/crypto/tls-ca-cert.pem
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/tls-ca/admin
fabric-ca-client register -d --id.name orderer.example.com --id.secret ordererPW --id.type orderer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name peer0.org1.example.com --id.secret peer1pw --id.type peer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name peer1.org1.example.com --id.secret peer2pw --id.type peer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name peer0.org2.example.com --id.secret peer1pw --id.type peer -u https://0.0.0.0:5052
fabric-ca-client register -d --id.name peer1.org2.example.com --id.secret peer2pw --id.type peer -u https://0.0.0.0:5052

# SETUP ORDERER
# Enrol orderer example.com
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org0/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org0/ca/admin
fabric-ca-client enroll -d -u https://rca-org0-admin:rca-org0-adminpw@0.0.0.0:5053

# Reigster orderer
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org0/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org0/ca/admin
fabric-ca-client register -d --id.name orderer.example.com --id.secret ordererpw --id.type orderer -u https://0.0.0.0:5053

# Register orderer admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org0/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org0/ca/admin
fabric-ca-client register -d --id.name Admin@example.com --id.secret ordererpw --id.type client \
--id.attrs '"hf.Registrar.Roles=client,orderer,peer,user","hf.Registrar.DelegateRoles=client,orderer,peer,user",hf.Registrar.Attributes=*,hf.GenCRL=true,hf.Revoker=true,hf.AffiliationMgr=true,hf.IntermediateCA=true,admin=true:ecert,role=admin:ecert,abac.init=true:ecert' \
-u https://0.0.0.0:5053

sleep 2

# Prepare assets
mkdir -p $CURRENT_DIR/org0/orderer/assets/ca
cp $CURRENT_DIR/org0/ca/crypto/ca-cert.pem $CURRENT_DIR/org0/orderer/assets/ca/org0-ca-cert.pem
mkdir -p $CURRENT_DIR/org0/orderer/assets/tls-ca
cp $CURRENT_DIR/tls-ca/crypto/tls-ca-cert.pem $CURRENT_DIR/org0/orderer/assets/tls-ca/tls-ca-cert.pem

# Enrol orderer
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org0/orderer
export FABRIC_CA_CLIENT_MSPDIR=msp
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org0/orderer/assets/ca/org0-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer.example.com:ordererpw@0.0.0.0:5053

# Enrol tls for orderer
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org0/orderer
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org0/orderer/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://orderer.example.com:ordererPW@0.0.0.0:5052 --enrollment.profile tls --csr.hosts orderer.example.com

# Enrol orderer admin
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org0/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org0/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://Admin@example.com:ordererpw@0.0.0.0:5053

sleep 2

# Create admincerts
mkdir $CURRENT_DIR/org0/orderer/msp/admincerts
cp $CURRENT_DIR/org0/admin/msp/signcerts/cert.pem $CURRENT_DIR/org0/orderer/msp/admincerts/org0-admin-cert.pem
mkdir $CURRENT_DIR/org0/admin/msp/admincerts
cp $CURRENT_DIR/org0/admin/msp/signcerts/cert.pem $CURRENT_DIR/org0/admin/msp/admincerts/org0-admin-cert.pem
mkdir -p $CURRENT_DIR/org0/msp/admincerts
cp $CURRENT_DIR/org0/admin/msp/signcerts/cert.pem $CURRENT_DIR/org0/msp/admincerts/org0-admin-cert.pem

# SETUP ORG1
# Enrol org1 root ca
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org1/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org1/ca/admin
fabric-ca-client enroll -d -u https://rca-org1-admin:rca-org1-adminpw@0.0.0.0:5054

# Register org1 peers
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org1/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org1/ca/admin
fabric-ca-client register -d --id.name peer0.org1.example.com --id.secret peer1pw --id.type peer -u https://0.0.0.0:5054
fabric-ca-client register -d --id.name peer1.org1.example.com --id.secret peer2pw --id.type peer -u https://0.0.0.0:5054

# Register org1 admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org1/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org1/ca/admin
fabric-ca-client register -d --id.name Admin@org1.example.com --id.secret peer1pw --id.type client \
--id.attrs '"hf.Registrar.Roles=client,orderer,peer,user","hf.Registrar.DelegateRoles=client,orderer,peer,user",hf.Registrar.Attributes=*,hf.GenCRL=true,hf.Revoker=true,hf.AffiliationMgr=true,hf.IntermediateCA=true,admin=true:ecert,role=admin:ecert,abac.init=true:ecert' \
-u https://0.0.0.0:5054

sleep 2

# Prepare assets
mkdir -p $CURRENT_DIR/org1/peer0/assets/ca
cp $CURRENT_DIR/org1/ca/crypto/ca-cert.pem $CURRENT_DIR/org1/peer0/assets/ca/org1-ca-cert.pem
mkdir -p $CURRENT_DIR/org1/peer0/assets/tls-ca
cp $CURRENT_DIR/tls-ca/crypto/tls-ca-cert.pem $CURRENT_DIR/org1/peer0/assets/tls-ca/tls-ca-cert.pem

# Enrol org1 peer0
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org1/peer0
export FABRIC_CA_CLIENT_MSPDIR=msp
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org1/peer0/assets/ca/org1-ca-cert.pem
fabric-ca-client enroll -d -u https://peer0.org1.example.com:peer1pw@0.0.0.0:5054

# Enrol tls for org1 peer0
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org1/peer0
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org1/peer0/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer0.org1.example.com:peer1pw@0.0.0.0:5052 --enrollment.profile tls --csr.hosts peer0.org1.example.com

sleep 2
# Prepare assets
mkdir -p $CURRENT_DIR/org1/peer1/assets/ca
cp $CURRENT_DIR/org1/ca/crypto/ca-cert.pem $CURRENT_DIR/org1/peer1/assets/ca/org1-ca-cert.pem
mkdir -p $CURRENT_DIR/org1/peer1/assets/tls-ca
cp $CURRENT_DIR/tls-ca/crypto/tls-ca-cert.pem $CURRENT_DIR/org1/peer1/assets/tls-ca/tls-ca-cert.pem

# Enrol org1 peer1
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org1/peer1
export FABRIC_CA_CLIENT_MSPDIR=msp
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org1/peer1/assets/ca/org1-ca-cert.pem
fabric-ca-client enroll -d -u https://peer1.org1.example.com:peer2pw@0.0.0.0:5054

# Enrol tls for org1 peer1
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org1/peer1
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org1/peer1/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer1.org1.example.com:peer2pw@0.0.0.0:5052 --enrollment.profile tls --csr.hosts peer1.org1.example.com

# Enrol org1 admin
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org1/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org1/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://Admin@org1.example.com:peer1pw@0.0.0.0:5054

sleep 2

# Ceate admincerts
mkdir -p $CURRENT_DIR/org1/peer0/msp/admincerts
cp $CURRENT_DIR/org1/admin/msp/signcerts/cert.pem $CURRENT_DIR/org1/peer0/msp/admincerts/org1-admin-cert.pem
mkdir -p $CURRENT_DIR/org1/peer1/msp/admincerts
cp $CURRENT_DIR/org1/admin/msp/signcerts/cert.pem $CURRENT_DIR/org1/peer1/msp/admincerts/org1-admin-cert.pem
mkdir -p $CURRENT_DIR/org1/admin/msp/admincerts
cp $CURRENT_DIR/org1/admin/msp/signcerts/cert.pem $CURRENT_DIR/org1/admin/msp/admincerts/org1-admin-cert.pem
mkdir -p $CURRENT_DIR/org1/msp/admincerts
cp $CURRENT_DIR/org1/admin/msp/signcerts/cert.pem $CURRENT_DIR/org1/msp/admincerts/org1-admin-cert.pem

mv $CURRENT_DIR/org0/orderer/tls-msp/keystore/$(ls $CURRENT_DIR/org0/orderer/tls-msp/keystore) $CURRENT_DIR/org0/orderer/tls-msp/keystore/key.pem
mv $CURRENT_DIR/org1/peer0/tls-msp/keystore/$(ls $CURRENT_DIR/org1/peer0/tls-msp/keystore) $CURRENT_DIR/org1/peer0/tls-msp/keystore/key.pem
mv $CURRENT_DIR/org1/peer1/tls-msp/keystore/$(ls $CURRENT_DIR/org1/peer1/tls-msp/keystore) $CURRENT_DIR/org1/peer1/tls-msp/keystore/key.pem

# SETUP ORG2
# Enrol org2 root ca
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org2/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org2/ca/admin
fabric-ca-client enroll -d -u https://rca-org2-admin:rca-org2-adminpw@0.0.0.0:5055

# Register org2 peers
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org2/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org2/ca/admin
fabric-ca-client register -d --id.name peer0.org2.example.com --id.secret peer1pw --id.type peer -u https://0.0.0.0:5055 && \
fabric-ca-client register -d --id.name peer1.org2.example.com --id.secret peer2pw --id.type peer -u https://0.0.0.0:5055

export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org2/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org2/ca/admin
fabric-ca-client register -d --id.name Admin@org2.example.com --id.secret peer1pw --id.type client \
--id.attrs '"hf.Registrar.Roles=client,orderer,peer,user","hf.Registrar.DelegateRoles=client,orderer,peer,user",hf.Registrar.Attributes=*,hf.GenCRL=true,hf.Revoker=true,hf.AffiliationMgr=true,hf.IntermediateCA=true,admin=true:ecert,role=admin:ecert,abac.init=true:ecert' \
-u https://0.0.0.0:5055

sleep 2

mkdir -p $CURRENT_DIR/org2/peer0/assets/ca
cp $CURRENT_DIR/org2/ca/crypto/ca-cert.pem $CURRENT_DIR/org2/peer0/assets/ca/org2-ca-cert.pem
mkdir -p $CURRENT_DIR/org2/peer0/assets/tls-ca
cp $CURRENT_DIR/tls-ca/crypto/tls-ca-cert.pem $CURRENT_DIR/org2/peer0/assets/tls-ca/tls-ca-cert.pem

# Enrol tls for org2 peer0
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org2/peer0
export FABRIC_CA_CLIENT_MSPDIR=msp
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org2/peer0/assets/ca/org2-ca-cert.pem
fabric-ca-client enroll -d -u https://peer0.org2.example.com:peer1pw@0.0.0.0:5055

# Enrol tls for org2 peer0
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org2/peer0
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org2/peer0/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer0.org2.example.com:peer1pw@0.0.0.0:5052 --enrollment.profile tls --csr.hosts peer0.org2.example.com

sleep 2

# Prepare assets
mkdir -p $CURRENT_DIR/org2/peer1/assets/ca
cp $CURRENT_DIR/org2/ca/crypto/ca-cert.pem $CURRENT_DIR/org2/peer1/assets/ca/org2-ca-cert.pem
mkdir -p $CURRENT_DIR/org2/peer1/assets/tls-ca
cp $CURRENT_DIR/tls-ca/crypto/tls-ca-cert.pem $CURRENT_DIR/org2/peer1/assets/tls-ca/tls-ca-cert.pem

# Enrol org2 peer1
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org2/peer1
export FABRIC_CA_CLIENT_MSPDIR=msp
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org2/peer1/assets/ca/org2-ca-cert.pem
fabric-ca-client enroll -d -u https://peer1.org2.example.com:peer2pw@0.0.0.0:5055

# Enrol tls for org2 peer1
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org2/peer1
export FABRIC_CA_CLIENT_MSPDIR=tls-msp
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org2/peer1/assets/tls-ca/tls-ca-cert.pem
fabric-ca-client enroll -d -u https://peer1.org2.example.com:peer2pw@0.0.0.0:5052 --enrollment.profile tls --csr.hosts peer1.org2.example.com

sleep 2
mv $CURRENT_DIR/org2/peer0/tls-msp/keystore/$(ls $CURRENT_DIR/org2/peer0/tls-msp/keystore) $CURRENT_DIR/org2/peer0/tls-msp/keystore/key.pem
mv $CURRENT_DIR/org2/peer1/tls-msp/keystore/$(ls $CURRENT_DIR/org2/peer1/tls-msp/keystore) $CURRENT_DIR/org2/peer1/tls-msp/keystore/key.pem
mv $CURRENT_DIR/org1/admin/msp/keystore/$(ls $CURRENT_DIR/org1/admin/msp/keystore) $CURRENT_DIR/org1/admin/msp/keystore/key.pem

# Enrol org2 admin
export FABRIC_CA_CLIENT_HOME=$CURRENT_DIR/org2/admin
export FABRIC_CA_CLIENT_TLS_CERTFILES=$CURRENT_DIR/org2/ca/crypto/ca-cert.pem
export FABRIC_CA_CLIENT_MSPDIR=msp
fabric-ca-client enroll -d -u https://Admin@org2.example.com:peer1pw@0.0.0.0:5055

sleep 2
mv $CURRENT_DIR/org2/admin/msp/keystore/$(ls $CURRENT_DIR/org2/admin/msp/keystore) $CURRENT_DIR/org2/admin/msp/keystore/key.pem

# Prepare admincerts
mkdir -p $CURRENT_DIR/org2/peer0/msp/admincerts
cp $CURRENT_DIR/org2/admin/msp/signcerts/cert.pem $CURRENT_DIR/org2/peer0/msp/admincerts/org2-admin-cert.pem
mkdir -p $CURRENT_DIR/org2/peer1/msp/admincerts
cp $CURRENT_DIR/org2/admin/msp/signcerts/cert.pem $CURRENT_DIR/org2/peer1/msp/admincerts/org2-admin-cert.pem
mkdir -p $CURRENT_DIR/org2/admin/msp/admincerts
cp $CURRENT_DIR/org2/admin/msp/signcerts/cert.pem $CURRENT_DIR/org2/admin/msp/admincerts/org2-admin-cert.pem
mkdir -p $CURRENT_DIR/org2/msp/admincerts
cp $CURRENT_DIR/org2/admin/msp/signcerts/cert.pem $CURRENT_DIR/org2/msp/admincerts/org2-admin-cert.pem

# Prepare msp
mkdir -p $CURRENT_DIR/org0/msp/cacerts
mkdir -p $CURRENT_DIR/org1/msp/cacerts
mkdir -p $CURRENT_DIR/org2/msp/cacerts
mkdir -p $CURRENT_DIR/org0/msp/tlscacerts
mkdir -p $CURRENT_DIR/org1/msp/tlscacerts
mkdir -p $CURRENT_DIR/org2/msp/tlscacerts
cp $CURRENT_DIR/org0/ca/crypto/ca-cert.pem $CURRENT_DIR/org0/msp/cacerts/org0-ca-cert.pem
cp $CURRENT_DIR/org1/ca/crypto/ca-cert.pem $CURRENT_DIR/org1/msp/cacerts/org1-ca-cert.pem
cp $CURRENT_DIR/org2/ca/crypto/ca-cert.pem $CURRENT_DIR/org2/msp/cacerts/org2-ca-cert.pem
cp $CURRENT_DIR/tls-ca/crypto/tls-ca-cert.pem $CURRENT_DIR/org0/msp/tlscacerts/tls-ca-cert.pem
cp $CURRENT_DIR/tls-ca/crypto/tls-ca-cert.pem $CURRENT_DIR/org1/msp/tlscacerts/tls-ca-cert.pem
cp $CURRENT_DIR/tls-ca/crypto/tls-ca-cert.pem $CURRENT_DIR/org2/msp/tlscacerts/tls-ca-cert.pem

# Prepare configtx
cp ./configtx.yaml ./hosts/configtx.yaml
cd $CURRENT_DIR
../../network2/bin/configtxgen -configPath $CURRENT_DIR -profile TwoOrgsOrdererGenesis -channelID syschannel -outputBlock $CURRENT_DIR/org0/orderer/genesis.block
../../network2/bin/configtxgen -configPath $CURRENT_DIR -profile TwoOrgsChannel -channelID mychannel -outputCreateChannelTx $CURRENT_DIR/org0/orderer/channel.tx

sleep 1

cp $CURRENT_DIR/org0/orderer/channel.tx $CURRENT_DIR/org1/peer0/assets/channel.tx
cp $CURRENT_DIR/org0/orderer/channel.tx $CURRENT_DIR/org2/peer0/assets/channel.tx

