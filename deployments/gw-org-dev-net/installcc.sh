cd ../../packages/chaincode
# yarn install
yarn build

# Install chaincode
docker exec cli.etradeconnect.net sh -c "/setup/install_chaincode.sh etradeconnect.net peer0 eventstore 1.0 7051 EtcMSP/admin EtcMSP/peer0.etradeconnect.net"
docker exec cli.etradeconnect.net sh -c "/setup/install_chaincode.sh etradeconnect.net peer0 privatedata 1.0 7051 EtcMSP/admin EtcMSP/peer0.etradeconnect.net"
docker exec cli.etradeconnect.net sh -c "/setup/install_chaincode.sh etradeconnect.net peer1 eventstore 1.0 7151 EtcMSP/admin EtcMSP/peer1.etradeconnect.net"
docker exec cli.etradeconnect.net sh -c "/setup/install_chaincode.sh etradeconnect.net peer1 privatedata 1.0 7151 EtcMSP/admin EtcMSP/peer1.etradeconnect.net"
docker exec cli.pbctfp.net sh -c "/setup/install_chaincode.sh pbctfp.net peer0 eventstore 1.0 7251 PbctfpMSP/admin PbctfpMSP/peer0.pbctfp.net"
docker exec cli.pbctfp.net sh -c "/setup/install_chaincode.sh pbctfp.net peer0 privatedata 1.0 7251 PbctfpMSP/admin PbctfpMSP/peer0.pbctfp.net"
docker exec cli.pbctfp.net sh -c "/setup/install_chaincode.sh pbctfp.net peer1 eventstore 1.0 7351 PbctfpMSP/admin PbctfpMSP/peer1.pbctfp.net"
docker exec cli.pbctfp.net sh -c "/setup/install_chaincode.sh pbctfp.net peer1 privatedata 1.0 7351 PbctfpMSP/admin PbctfpMSP/peer1.pbctfp.net"
docker exec cli.hsbc.com.hk sh -c "/setup/install_chaincode.sh hsbc.com.hk peer0 eventstore 1.0 7451 HsbcMSP/admin HsbcMSP/peer0.hsbc.com.hk"
docker exec cli.hsbc.com.hk sh -c "/setup/install_chaincode.sh hsbc.com.hk peer0 privatedata 1.0 7451 HsbcMSP/admin HsbcMSP/peer0.hsbc.com.hk"
docker exec cli.hsbc.com.hk sh -c "/setup/install_chaincode.sh hsbc.com.hk peer1 eventstore 1.0 7551 HsbcMSP/admin HsbcMSP/peer1.hsbc.com.hk"
docker exec cli.hsbc.com.hk sh -c "/setup/install_chaincode.sh hsbc.com.hk peer1 privatedata 1.0 7551 HsbcMSP/admin HsbcMSP/peer1.hsbc.com.hk"

# Instantiate chaincode
docker exec cli.etradeconnect.net sh -c "/setup/instantiate_chaincode_org1.sh"

# Invoke chaincode
docker exec cli.etradeconnect.net sh -c "/setup/invoke_chaincode_org1.sh"
