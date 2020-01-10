import execa from 'execa';
import { pick, values } from 'lodash';
import { Commit } from '..';
import { createCommitId } from '../ledger-api';
import { parseResult, toString } from './__utils__';

const entityName = 'dev_entity';
const id = 'ent_dev_1001';
const eventStr = toString([{ type: 'mon', payload: { name: 'jun' } }]);
const base_args = [
  'exec',
  '-e',
  'CORE_PEER_LOCALMSPID=Org1MSP',
  '-e',
  'CORE_PEER_ADDRESS=peer0.org1.example.com:7051',
  '-e',
  'CORE_PEER_TLS_ROOTCERT_FILE=/tmp/hyperledger/Org1MSP/peer0.org1.example.com/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem',
  '-e',
  'CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/Org1MSP/admin/msp'
];

const query_args = [
  'cli.org1.example.com',
  'peer',
  'chaincode',
  'query',
  '-C',
  'eventstore',
  '-n',
  'eventstore',
  '-c'
];

const invoke_args = [
  'cli.org1.example.com',
  'peer',
  'chaincode',
  'invoke',
  '-o',
  'orderer1.example.com:7050',
  '--waitForEvent',
  '--tls=true',
  '-C',
  'eventstore',
  '-n',
  'eventstore',
  '--cafile',
  '/tmp/hyperledger/Org1MSP/peer0.org1.example.com/assets/tls-ca/tls-ca-cert.pem',
  '-c'
];

let commitId: string;

describe('Chaincode Integration Tests', () => {
  it('should queryByEntityName #1', async () =>
    execa('docker', [
      ...base_args,
      ...query_args,
      `{"Args":["eventstore:queryByEntityName", "${entityName}"]}`
    ])
      .then<any[]>(({ stdout }) => values(parseResult(stdout)))
      .then(commits =>
        commits
          .map(commit => pick(commit, 'entityName'))
          .map(result => expect(result).toEqual({ entityName }))
      ));

  it('should queryByEntityId', async () =>
    execa('docker', [
      ...base_args,
      ...query_args,
      `{"Args":["queryByEntityId","${entityName}","${id}"]}`
    ])
      .then<any[]>(({ stderr, stdout }) => values(parseResult(stdout)))
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

  it('should createCommit #1', async () =>
    execa('docker', [
      ...base_args,
      ...invoke_args,
      `{"Args":["createCommit","${entityName}","id_00001","0","${eventStr}","${createCommitId()}"]}`
    ]).then(({ stderr }) => expect(stderr).toContain('result: status:200')));

  it('should createCommit #2', async () =>
    execa('docker', [
      ...base_args,
      ...invoke_args,
      `{"Args":["createCommit","${entityName}","id_00001","0","${eventStr}","${createCommitId()}"]}`
    ]).then(({ stderr }) => expect(stderr).toContain('result: status:200')));

  it('should queryByEntityId #2', async () =>
    execa('docker', [
      ...base_args,
      ...query_args,
      `{"Args":["queryByEntityId","${entityName}","id_00001"]}`
    ])
      .then(({ stdout }) => values(parseResult(stdout))[0] as Commit)
      .then(commit => {
        commitId = commit.commitId;
        expect(commit.id).toEqual('id_00001');
      }));

  it('should queryByEntityIdCommitId', async () =>
    execa('docker', [
      ...base_args,
      ...query_args,
      `{"Args":["queryByEntityIdCommitId","${entityName}","id_00001","${commitId}"]}`
    ])
      .then(({ stdout }) => values(parseResult(stdout))[0] as Commit)
      .then(commit => expect(commit.commitId).toEqual(commitId)));

  it('should deleteByEntityIdCommitId', async () =>
    execa('docker', [
      ...base_args,
      ...invoke_args,
      `{"Args":["deleteByEntityIdCommitId","${entityName}","id_00001","${commitId}"]}`
    ]).then(({ stderr }) => expect(stderr).toContain('result: status:200')));

  // bug: this has timming bug. Sometimes, when above two createCommit has not completed, before this test starts.
  // Then, nothing can be deleted. This is testing bug; its underlying implementation works fine.
  it('should deleteByEntityId', async () =>
    execa('docker', [
      ...base_args,
      ...invoke_args,
      `{"Args":["deleteByEntityId","${entityName}","id_00001"]}`
    ]).then(({ stderr }) => expect(stderr).toContain('result: status:200')));

  it('should fail to queryByEntityId', async () =>
    execa('docker', [
      ...base_args,
      ...query_args,
      `{"Args":["queryByEntityId","${entityName}","id_00001"]}`
    ])
      .then(({ stdout }) => parseResult(stdout))
      .then(commits => expect(commits).toEqual({})));

  it('should fail to deleteByEntityIdCommitId', async () =>
    execa('docker', [
      ...base_args,
      ...invoke_args,
      `{"Args":["deleteByEntityIdCommitId","${entityName}","id_00001","${commitId}"]}`
    ]).then(({ stderr }) =>
      expect(stderr).toContain('Chaincode invoke successful')
    ));

  it('should fail to createCommit', async () =>
    execa('docker', [
      ...base_args,
      ...invoke_args,
      `{"Args":["createCommit","${entityName}","","0","${eventStr}","${createCommitId()}"]}`
    ]).catch(({ stderr }) => expect(stderr).toContain('null argument')));


});
