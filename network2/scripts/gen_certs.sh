docker exec ca-tls sh -c "/setup/enroll_tls.sh"
docker exec rca-org0 sh -c "/setup/enroll_org0.sh"
docker exec rca-org1 sh -c "/setup/enroll_org1.sh"
docker exec rca-org2 sh -c "/setup/enroll_org2.sh"
