docker exec ca.tls sh -c "/setup/enroll_tls.sh"
docker exec rca.example.com sh -c "/setup/enroll_org0.sh"
docker exec rca.org1.example.com sh -c "/setup/enroll_org1.sh"
docker exec rca.org2.example.com sh -c "/setup/enroll_org2.sh"
