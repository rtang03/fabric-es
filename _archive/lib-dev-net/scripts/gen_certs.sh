docker exec tls-ca-hktfp sh -c "/setup/enroll_tls.sh"
docker exec rca-hktfp sh -c "/setup/enroll_org0.sh"
docker exec rca-etradeconnect sh -c "/setup/enroll_org1.sh"
docker exec rca-pbctfp sh -c "/setup/enroll_org2.sh"
