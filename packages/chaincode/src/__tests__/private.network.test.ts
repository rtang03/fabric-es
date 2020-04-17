import { exec } from 'child-process-promise';
import { keys, pick, values } from 'lodash';
import { Commit, createCommitId } from '../ledger-api';

let commitId: string;
const entityName = 'private_entityName';
const id = 'id_00001';
const cli = `export EVENT_STR=$(echo "[{\\\"type\\\":\\\"testtype\\\"}]" | base64 | tr -d \\\\n) && docker exec \
-e CORE_PEER_LOCALMSPID=Org1MSP \
-e CORE_PEER_ADDRESS=peer0-org1:7051 \
-e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org1MSP/peer0.org1.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
-e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org1MSP/admin/msp `;
const query = `${cli} cli peer chaincode query -C loanapp -n eventstore -c `;
const invoke = `${cli} cli peer chaincode invoke -o orderer0-org0:7050 --waitForEvent --tls -C loanapp -n eventstore --cafile /var/artifacts/crypto-config/Org1MSP/peer0.org1.net/assets/tls-ca/tls-ca-cert.pem -c `;
const cli2 = `docker exec \
-e CORE_PEER_LOCALMSPID=Org2MSP \
-e CORE_PEER_ADDRESS=peer0-org2:7251 \
-e CORE_PEER_TLS_ROOTCERT_FILE=/var/artifacts/crypto-config/Org2MSP/peer0.org2.net/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
-e CORE_PEER_MSPCONFIGPATH=/var/artifacts/crypto-config/Org2MSP/admin/msp `;
const query2 = `${cli2} cli peer chaincode query -C loanapp -n eventstore -c `;

const parseResult = input => JSON.parse(Buffer.from(JSON.parse(input)).toString());

describe('Chaincode private data: Network Test', () => {
  it('should createCommit #1', async () =>
    exec(
      `${invoke} '{"Args":["privatedata:createCommit","${entityName}","${id}","0","${createCommitId()}"]}' --transient "{\\\"eventstr\\\":\\\"$EVENT_STR\\\"}"`
    ).then(({ stderr }) => expect(stderr).toContain('result: status:200')));

  it('should createCommit #2', async () =>
    exec(
      `${invoke} '{"Args":["privatedata:createCommit","${entityName}","${id}","0","${createCommitId()}"]}' --transient "{\\\"eventstr\\\":\\\"$EVENT_STR\\\"}"`
    ).then(({ stderr }) => expect(stderr).toContain('result: status:200')));

  it('should queryByEntityId #1', async () =>
    exec(`${query} '{"Args":["privatedata:queryByEntityId","${entityName}","${id}"]}'`)
      .then(({ stdout }) => values(parseResult(stdout))[0] as Commit)
      .then(commit => {
        commitId = commit.commitId;
        expect(commit.id).toEqual('id_00001');
      }));

  it('should queryByEntityName #1', async () =>
    exec(`${query} '{"Args":["privatedata:queryByEntityName","${entityName}"]}'`)
      .then(({ stdout }) => values(parseResult(stdout)))
      .then(commits =>
        commits.map(commit => pick(commit, 'entityName')).map(result => expect(result).toEqual({ entityName }))
      ));

  it('should queryByEntityIdCommitId', async () =>
    exec(`${query} '{"Args":["privatedata:queryByEntityIdCommitId","${entityName}","${id}","${commitId}"]}'`)
      .then(({ stdout }) => values(parseResult(stdout))[0] as Commit)
      .then(commit => expect(commit.commitId).toEqual(commitId)));

  it('should fail to queryByEntityIdCommitId by unauthorized peer', async () =>
    exec(
      `${query2} '{"Args":["privatedata:queryByEntityIdCommitId","${entityName}","${id}","${commitId}"]}'`
    ).catch(({ stderr }) => expect(stderr).toContain('does not have read access permission')));

  it('should deleteByEntityIdCommitId', async () =>
    exec(
      `${invoke} '{"Args":["privatedata:deleteByEntityIdCommitId","${entityName}","${id}","${commitId}"]}'`
    ).then(({ stderr }) => expect(stderr).toContain('result: status:200')));

  it('should fail to deleteByEntityIdCommitId', async () =>
    exec(
      `${invoke} '{"Args":["privatedata:deleteByEntityIdCommitId","${entityName}","no such id","${commitId}"]}'`
    ).catch(({ stderr }) => expect(stderr).toContain('commitId does not exist')));

  it('should deleteAll', async () =>
    exec(`${query} '{"Args":["privatedata:queryByEntityId","${entityName}","${id}"]}'`)
      .then(({ stdout }) => parseResult(stdout))
      .then(commits => keys(commits))
      .then(async commitIds => {
        for (const cid of commitIds) {
          await exec(
            `${invoke} '{"Args":["privatedata:deleteByEntityIdCommitId","${entityName}","${id}","${cid}"]}'`
          ).then(({ stderr }) => expect(stderr).toContain('result: status:200'));
        }
      }));

  /**
   * This test fails, need to revisit later.
   */
  // it('should queryByEntityName #2', async () =>
  //   exec(
  //     `${query} '{"Args":["privatedata:queryByEntityName","${org1}","${entityName}"]}'`
  //   )
  //     .then(({ stdout }) => parseResult(stdout))
  //     .then(commits => expect(commits).toEqual({})));

  it('should fail to queryByEntityIdCommitId', async () =>
    exec(`${query} '{"Args":["privatedata:queryByEntityIdCommitId","${entityName}","${id}","${commitId}"]}'`)
      .then(({ stdout }) => parseResult(stdout))
      .then(result => expect(result).toEqual({})));
});
