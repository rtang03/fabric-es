import execa from 'execa';
import { keys, pick, values } from 'lodash';
import { Commit, createCommitId } from '../ledger-api';

let commitId: string;
const org1 = 'Org1PrivateDetails';
const org2 = 'Org2PrivateDetails';
const entityName = 'private_entityName';
const id = 'id_00001';
// const cli = `export EVENT_STR=$(echo "[{\\\"type\\\":\\\"testtype\\\"}]" | base64 | tr -d \\\\n) && docker exec \
// -e CORE_PEER_LOCALMSPID=Org1MSP \
// -e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 \
// -e CORE_PEER_TLS_ROOTCERT_FILE=/tmp/hyperledger/org1/peer0/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
// -e CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org1/admin/msp `;
// const query = `${cli} cli-org1 peer chaincode query -C eventstore -n privatedata -c `;
// const invoke = `${cli} cli-org1 peer chaincode invoke -o orderer.example.com:7050 --waitForEvent --tls -C eventstore -n privatedata --cafile /tmp/hyperledger/org1/peer0/assets/tls-ca/tls-ca-cert.pem -c `;
// const cli2 = `docker exec \
// -e CORE_PEER_LOCALMSPID=Org2MSP \
// -e CORE_PEER_ADDRESS=peer0.org2.example.com:9051 \
// -e CORE_PEER_TLS_ROOTCERT_FILE=/tmp/hyperledger/org2/peer0/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
// -e CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org2/admin/msp `;
// const query2 = `${cli2} cli-org2 peer chaincode query -C eventstore -n privatedata -c `;

const base_args_2 = [
  'exec',
  '-e',
  'CORE_PEER_LOCALMSPID=Org2MSP',
  '-e',
  'CORE_PEER_ADDRESS=peer0.org2.example.com:9051',
  '-e',
  'CORE_PEER_TLS_ROOTCERT_FILE=/tmp/hyperledger/Org2MSP/peer0.org2.example.com/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem',
  '-e',
  'CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/Org2MSP/admin/msp',
  'cli.org2.example.com',
  'peer',
  'chaincode',
  'query',
  '-C',
  'eventstore',
  '-n',
  'privatedata',
  '-c'
];

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
  'privatedata',
  '--cafile',
  '/tmp/hyperledger/Org1MSP/peer0.org1.example.com/assets/tls-ca/tls-ca-cert.pem',
  '-c'
];

const query_args = [
  'cli.org1.example.com',
  'peer',
  'chaincode',
  'query',
  '-C',
  'eventstore',
  '-n',
  'privatedata',
  '-c'
];

const parseResult = input =>
  JSON.parse(Buffer.from(JSON.parse(input)).toString());

describe('Chaincode private data: Integration Test', () => {
  /*
    export EVENT_STR=$(echo "[{\"type\":\"testtype\"}[" | base64 | tr -d \\n) &&
    docker exec \
    -e CORE_PEER_LOCALMSPID=Org1MSP \
    -e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 \
    -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
    -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp \
    cliOrg1 peer chaincode invoke -C mychannel -n privatedata  \
    -c '{"Args":["privatedata:createCommit","Org1PrivateDetails","private_entityName","id_00001","0"]}' --transient "{\"eventstr\":\"EVENT_STR\"}"
   */
  it('should createCommit #1', async () =>
    execa(
      'docker',
      [
        ...base_args,
        ...invoke_args,
        `'{"Args":["privatedata:createCommit","${org1}","${entityName}","${id}","0","${createCommitId()}"]}'`,
        '--transient',
        '"{\\"eventstr\\":\\"$EVENT_STR\\"}"'
      ],
      {
        env: {
          EVENT_STR:
            '$(echo "[{\\"type\\":\\"testtype\\"}]" | base64 | tr -d \\\\n)'
        }
      }
    ).then(({ stderr }) => expect(stderr).toContain('result: status:200')));

  it('should createCommit #2', async () =>
    execa(
      'docker',
      [
        ...base_args,
        ...invoke_args,
        `$'{"Args":["privatedata:createCommit","${org1}","${entityName}","${id}","0","${createCommitId()}"]}'`,
        '--transient',
        '"{\\"eventstr\\":\\"$EVENT_STR\\"}"'
      ],
      {
        env: {
          EVENT_STR:
            '$(echo "[{\\"type\\":\\"testtype\\"}]" | base64 | tr -d \\\\n)'
        }
      }
    ).then(({ stderr }) => expect(stderr).toContain('result: status:200')));

  /*
  docker exec \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp \
  cliOrg1 peer chaincode query -C mychannel -n privatedata \
  -c '{"Args":["privatedata:queryByEntityId","Org1PrivateDetails","private_entityName","id_00001"]}'
 */
  it('should queryByEntityId #1', async () =>
    execa('docker', [
      ...base_args,
      ...query_args,
      `'{"Args":["privatedata:queryByEntityId","${org1}","${entityName}","${id}"]}'`
    ])
      .then(({ stdout }) => values(parseResult(stdout))[0] as Commit)
      .then(commit => {
        commitId = commit.commitId;
        expect(commit.id).toEqual('id_00001');
      }));

  /*
  docker exec \
  -e CORE_PEER_LOCALMSPID=Org1MSP \
  -e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp \
  cliOrg1 peer chaincode query -C mychannel -n privatedata \
  -c '{"Args":["privatedata:queryByEntityName","Org1PrivateDetails","private_entityName","private_1001"]}'
 */
  it('should queryByEntityName #1', async () =>
    execa('docker', [
      ...base_args,
      ...query_args,
      `'{"Args":["privatedata:queryByEntityName","${org1}","${entityName}"]}'`
    ])
      .then(({ stdout }) => values(parseResult(stdout)))
      .then(commits =>
        commits
          .map(commit => pick(commit, 'entityName'))
          .map(result => expect(result).toEqual({ entityName }))
      ));

  it('should queryByEntityIdCommitId', async () =>
    execa('docker', [
      ...base_args,
      ...query_args,
      `'{"Args":["privatedata:queryByEntityIdCommitId","${org1}","${entityName}","${id}","${commitId}"]}'`
    ])
      .then(({ stdout }) => values(parseResult(stdout))[0] as Commit)
      .then(commit => expect(commit.commitId).toEqual(commitId)));

  it('should fail to queryByEntityIdCommitId by unauthorized peer', async () =>
    execa('docker', [
      ...base_args_2,
      `'{"Args":["privatedata:queryByEntityIdCommitId","${org2}","${entityName}","${id}","${commitId}"]}'`
    ]).catch(({ stderr }) =>
      expect(stderr).toContain('does not have read access permission')
    ));

  it('should deleteByEntityIdCommitId', async () =>
    execa('docker', [
      ...base_args,
      ...invoke_args,
      `'{"Args":["privatedata:deleteByEntityIdCommitId","${org1}","${entityName}","${id}","${commitId}"]}'`
    ]).then(({ stderr }) => expect(stderr).toContain('result: status:200')));

  it('should fail to deleteByEntityIdCommitId', async () =>
    execa('docker', [
      ...base_args,
      ...invoke_args,
      `'{"Args":["privatedata:deleteByEntityIdCommitId","${org1}","${entityName}","no such id","${commitId}"]}'`
    ]).catch(({ stderr }) =>
      expect(stderr).toContain('commitId does not exist')
    ));

  it('should deleteAll', async () =>
    execa('docker', [
      ...base_args,
      ...query_args,
      `'{"Args":["privatedata:queryByEntityId","${org1}","${entityName}","${id}"]}'`
    ])
      .then(({ stdout }) => parseResult(stdout))
      .then(commits => keys(commits))
      .then(async commitIds => {
        for (const cid of commitIds) {
          await execa('docker', [
            ...base_args,
            ...invoke_args,
            `'{"Args":["privatedata:deleteByEntityIdCommitId","${org1}","${entityName}","${id}","${cid}"]}'`
          ]).then(({ stderr }) =>
            expect(stderr).toContain('result: status:200')
          );
        }
      }));

  it('should queryByEntityName #2', async () =>
    execa('docker', [
      ...base_args,
      ...query_args,
      `'{"Args":["privatedata:queryByEntityName","${org1}","${entityName}"]}'`
    ])
      .then(({ stdout }) => parseResult(stdout))
      .then(commits => expect(commits).toEqual({})));

  it('should fail to queryByEntityIdCommitId', async () =>
    execa('docker', [
      ...base_args,
      ...query_args,
      `'{"Args":["privatedata:queryByEntityIdCommitId","${org1}","${entityName}","${id}","${commitId}"]}'`
    ])
      .then(({ stdout }) => parseResult(stdout))
      .then(result => expect(result).toEqual({})));
});
