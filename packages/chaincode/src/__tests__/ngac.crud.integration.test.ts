import { exec } from 'child-process-promise';
import { parseResult, toString } from './__utils__';

const entityName = 'ngactest';
const entityId = 'entityid_001';
const id =
  'x509::/C=US/ST=North Carolina/O=Hyperledger/OU=client/CN=Admin@org1.example.com::/C=US/ST=North Carolina/O=Hyperledger/OU=Fabric/CN=rca-org1';
const cli = `docker exec \
-e CORE_PEER_LOCALMSPID=Org1MSP \
-e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 \
-e CORE_PEER_TLS_ROOTCERT_FILE=/tmp/hyperledger/org1/peer0/tls-msp/tlscacerts/tls-0-0-0-0-5052.pem \
-e CORE_PEER_MSPCONFIGPATH=/tmp/hyperledger/org1/admin/msp `;
const query = `${cli} cli-org1 peer chaincode query -C eventstore -n eventstore -c `;
const invoke = `${cli} cli-org1 peer chaincode invoke -o orderer.example.com:7050 --waitForEvent --tls -C eventstore -n eventstore \
--cafile /tmp/hyperledger/org1/peer0/assets/tls-ca/tls-ca-cert.pem -c `;

// Note that: the below test does not check the returned results.
describe('Chaincode Ngac CRUD Integration Tests', () => {
  it('should getMSPAttrByMSPID', async () =>
    exec(`${query} '{"Args":["getMSPAttrByMSPID", "Org1MSP"]}'`)
      .then(({ stdout }) => parseResult(stdout))
      .then(result =>
        expect(result).toEqual([{ type: '1', key: 'mspid', value: 'Org1MSP' }])
      ));

  it('should getResourceAttrByURI', async () =>
    exec(
      `${query} '{"Args":["getResourceAttrByURI", "model/Org1MSP/ngactest"]}'`
    )
      .then(({ stdout }) => parseResult(stdout))
      .then(attributes => expect(attributes).toMatchSnapshot()));

  it('should getPolicyById', async () =>
    exec(`${query} '{"Args":["getPolicyById", "${id}"]}'`)
      .then(({ stdout }) => parseResult(stdout))
      .then(policies =>
        policies.map(({ effect }) => expect(effect).toEqual('Allow'))
      ));

  it('should getPolicyByIdSid', async () =>
    exec(`${query} '{"Args":["getPolicyByIdSid", "${id}", "allowCreateTest"]}'`)
      .then(({ stdout }) => parseResult(stdout))
      .then(result => expect(result).toMatchSnapshot()));

  it('should addPolicy', async () => {
    const pClass = 'crud-policy';
    const sid = 'allowCreateCRUDTest';
    const url = 'model/Org1MSP/test/crud_int_001';
    const events = toString(['CRUDTestCreated']);
    await exec(
      `${invoke} '{"Args":["addPolicy", "${pClass}", "${sid}", "${url}", "${events}", ""]}'`
    ).then(({ stderr }) => expect(stderr).toContain('result: status:200'));
  });

  it('should deletePolicyByIdSid', async () =>
    exec(
      `${invoke} '{"Args":["deletePolicyByIdSid", "${id}", "allowCreateCRUDTest"]}'`
    ).then(({ stderr }) => expect(stderr).toContain('result: status:200')));

  it('should addPolicy', async () => {
    const pClass = 'crud-policy';
    const sid = 'allowCreateCRUDTest2';
    const url = 'model/Org1MSP/test/crud_int_001';
    const events = toString(['CRUDTestCreated']);
    await exec(
      `${invoke} '{"Args":["addPolicy", "${pClass}", "${sid}", "${url}", "${events}", ""]}'`
    ).then(({ stderr }) => expect(stderr).toContain('result: status:200'));
  });

  // This test works fine. However, this removes the testing policy created by chaincode Instantiation
  // and therefore, it breaks the repetition of test execution.
  // it('should deletePolicyById', async () =>
  //   exec(`${invoke} '{"Args":["deletePolicyById", "${id}"]}'`).then(
  //     ({ stderr }) => expect(stderr).toContain('result: status:200')
  //   ));

  it('should addMSPAttr', async () => {
    const mspAttrsStr = JSON.stringify([
      { type: '1', key: 'mspid', value: 'Org1MSP' }
    ]).replace(/"/g, '\\"');
    await exec(
      `${invoke} '{"Args":["addMSPAttr", "Org1MSP", "${mspAttrsStr}"]}'`
    ).then(({ stderr }) => expect(stderr).toContain('result: status:200'));
  });

  // This test works fine. However, this removes the testing policy created by chaincode Instantiation
  // and therefore, it breaks the repetition of test execution.
  // it('should deleteMSPAttrByMSPID', async () =>
  //   exec(
  //     `${invoke} '{"Args":["deleteMSPAttrByMSPID", "Org1MSP"]}'`
  //   ).then(({ stderr }) => console.log(stderr)));

  it('should addResourceAttr', async () => {
    const resourceAttrsStr = toString([
      { type: '1', key: 'createCRUDTest', value: 'x509id' }
    ]);
    await exec(
      `${invoke} '{"Args":["addResourceAttr", "${entityName}", "${entityId}", "${resourceAttrsStr}"]}'`
    ).then(({ stderr }) => expect(stderr).toContain('result: status:200'));
  });

  it('should upsertResourceAttr', async () => {
    const resourceAttrsStr = toString([
      { type: '1', key: 'username', value: 'bob' }
    ]);
    await exec(
      `${invoke} '{"Args":["upsertResourceAttr", "${entityName}", "${entityId}", "${resourceAttrsStr}"]}'`
    ).then(({ stderr }) => expect(stderr).toContain('result: status:200'));
  });

  it('should deleteReourceAttrByURI', async () =>
    exec(
      `${invoke} '{"Args":["deleteReourceAttrByURI", "model/Org1MSP/ngactest/entityid_001"]}'`
    ).then(({ stderr }) => expect(stderr).toContain('result: status:200')));
});
