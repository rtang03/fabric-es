import { exec } from 'child-process-promise';
import { pick, values } from 'lodash';
import { Commit } from '..';

const entityName = 'dev_entity';
const id = 'ent_dev_1001';
const eventStr = JSON.stringify([{ type: 'mon', payload: { name: 'jun' } }]);
const cli = `docker exec \
-e CORE_PEER_LOCALMSPID=Org1MSP \
-e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 \
-e CORE_PEER_TLS_ROOTCERT_FILE=/tmp/hyperledger/org1/peer0/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
-e CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org1/admin/msp `;
const query = `${cli} cli-org1 peer chaincode query -C eventstore -n eventstore -c `;
const invoke = `${cli} cli-org1 peer chaincode invoke -o orderer.example.com:7050 --waitForEvent --tls -C eventstore -n eventstore \
--cafile /tmp/hyperledger/org1/peer0/assets/tls-ca/tls-ca-cert.pem -c `;

let commitId: string;

describe('Chaincode Integration Tests', () => {
  it('should queryByEntityName #1', async () =>
    await exec(`${query} '{"Args":["queryByEntityName", "${entityName}"]}'`)
      .then<any[]>(({ stdout }) =>
        values(JSON.parse(Buffer.from(JSON.parse(stdout)).toString()))
      )
      .then(commits =>
        commits
          .map(commit => pick(commit, 'entityName'))
          .map(result => expect(result).toEqual({ entityName }))
      ));

  it('should queryByEntityId', async () =>
    await exec(
      `${query} '{"Args":["queryByEntityId","${entityName}","${id}"]}'`
    )
      .then<any[]>(({ stderr, stdout }) =>
        values(JSON.parse(Buffer.from(JSON.parse(stdout)).toString()))
      )
      .then(commits =>
        commits
          .map(commit => pick(commit, 'entityName', 'id'))
          .map(result =>
            expect(result).toEqual({
              entityName,
              id
            })
          )
      ));
  /*
   docker exec \
   -e CORE_PEER_LOCALMSPID=Org1MSP \
   -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp \
   cliOrg1 peer chaincode invoke \
   -o orderer.example.com:7050 \
   -C mychannel -n eventstore --waitForEvent --tls \
   --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem \
   --peerAddresses peer0.org1.example.com:7051 \
   --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
   -c '{"Args":["createCommit", "dev_entity", "ent_dev_1001", "0","[{\"type\":\"mon\"}]"]}'
   */
  it('should createCommit #1', async () =>
    await exec(
      `${invoke} '{"Args":["createCommit","${entityName}","id_00001","0","${eventStr.replace(
        /"/g,
        '\\"'
      )}"]}'`
    ).then(({ stderr }) => expect(stderr).toContain('result: status:200')));

  it('should createCommit #2', async () =>
    await exec(
      `${invoke} '{"Args":["createCommit","${entityName}","id_00001","0","${eventStr.replace(
        /"/g,
        '\\"'
      )}"]}'`
    ).then(({ stderr }) => expect(stderr).toContain('result: status:200')));

  it('should queryByEntityId #2', async () =>
    await exec(
      `${query} '{"Args":["queryByEntityId","${entityName}","id_00001"]}'`
    )
      .then(
        ({ stdout }) =>
          values(
            JSON.parse(Buffer.from(JSON.parse(stdout)).toString())
          )[0] as Commit
      )
      .then(commit => {
        commitId = commit.commitId;
        expect(commit.id).toEqual('id_00001');
      }));

  it('should queryByEntityIdCommitId', async () =>
    await exec(
      `${query} '{"Args":["queryByEntityIdCommitId","${entityName}","id_00001","${commitId}"]}'`
    )
      .then(
        ({ stdout }) =>
          values(
            JSON.parse(Buffer.from(JSON.parse(stdout)).toString())
          )[0] as Commit
      )
      .then(commit => expect(commit.commitId).toEqual(commitId)));

  it('should deleteByEntityIdCommitId', async () =>
    await exec(
      `${invoke} '{"Args":["deleteByEntityIdCommitId","${entityName}","id_00001","${commitId}"]}'`
    ).then(({ stderr }) => expect(stderr).toContain('result: status:200')));

  // bug: this has timming bug. Sometimes, when above two createCommit has not completed, before this test starts.
  // Then, nothing can be deleted. This is testing bug; its underlying implementation works fine.
  it('should deleteByEntityId', async () =>
    await exec(
      `${invoke} '{"Args":["deleteByEntityId","${entityName}","id_00001"]}'`
    ).then(({ stderr }) => expect(stderr).toContain('result: status:200')));

  it('should fail to queryByEntityId', async () =>
    await exec(
      `${query} '{"Args":["queryByEntityId","${entityName}","id_00001"]}'`
    )
      .then(({ stdout }) =>
        JSON.parse(Buffer.from(JSON.parse(stdout)).toString())
      )
      .then(commits => expect(commits).toEqual({})));

  it('should fail to deleteByEntityIdCommitId', async () =>
    await exec(
      `${invoke} '{"Args":["deleteByEntityIdCommitId","${entityName}","id_00001","${commitId}"]}'`
    ).then(({ stderr }) =>
      expect(stderr).toContain('Chaincode invoke successful')
    ));

  it('should fail to createCommit', async () =>
    await exec(
      `${invoke} '{"Args":["createCommit","${entityName}","","0","${eventStr.replace(
        /"/g,
        '\\"'
      )}"]}'`
    ).catch(({ stderr }) => expect(stderr).toContain('null argument')));
});
