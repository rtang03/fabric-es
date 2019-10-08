import { exec } from 'child-process-promise';
import { pick, values } from 'lodash';

const entityName = 'dev_ngac';
const id = `ngac_${Math.floor(Math.random() * 1000)}`;
const eventStr = JSON.stringify([
  { type: 'UserCreated', payload: { name: 'john' } }
]);
const cli = `docker exec \
-e CORE_PEER_LOCALMSPID=Org1MSP \
-e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 \
-e CORE_PEER_TLS_ROOTCERT_FILE=/tmp/hyperledger/org1/peer0/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
-e CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org1/admin/msp `;
const query = `${cli} cli-org1 peer chaincode query -C eventstore -n eventstore -c `;
const invoke = `${cli} cli-org1 peer chaincode invoke -o orderer.example.com:7050 --waitForEvent --tls -C eventstore -n eventstore \
--cafile /tmp/hyperledger/org1/peer0/assets/tls-ca/tls-ca-cert.pem -c `;

describe('NGAC Integration Test', () => {
  // it('should create project/entity tagGroup ', async () => {});

  it('should createCommit #1', async () =>
    await exec(
      `${invoke} '{"Args":["createCommit","${entityName}","${id}","0","${eventStr.replace(
        /"/g,
        '\\"'
      )}"]}'`
    ).then(({ stderr }) => console.log(stderr)));

  it('should createCommit #1', async () =>
    await exec(
      `${invoke} '{"Args":["createCommit","${entityName}","${id}","0","${eventStr.replace(
        /"/g,
        '\\"'
      )}"]}'`
    ).then(({ stderr }) => console.log(stderr)));

  // should fail to create the entityId repeatedl at version 0
  // it('should createCommit #1', async () =>
  //   await exec(
  //     `${invoke} '{"Args":["createCommit","${entityName}","${id}","0","${eventStr.replace(
  //       /"/g,
  //       '\\"'
  //     )}"]}'`
  //   ).then(({ stderr }) => expect(stderr).toContain('result: status:200')));
});
