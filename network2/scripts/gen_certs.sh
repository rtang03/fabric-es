docker exec ca-tls bash -c "/setup/enroll_tls.sh"
docker exec rca-org0 bash -c "/setup/enroll_org0.sh"
docker exec rca-org1 bash -c "/setup/enroll_org1.sh"
docker exec rca-org2 bash -c "/setup/enroll_org2.sh"
