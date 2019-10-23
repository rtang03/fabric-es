import { Gateway, Network } from 'fabric-network';
import { bootstrap } from '../../account';
import { createId } from '../../createId';
import { Policy } from '../../types';
import evaluateNgac from '../evaluateNgac';
import submitNgac from '../submitNgac';

let network: Network;
let gateway: Gateway;

const identity = `service_ngac_test${Math.floor(Math.random() * 1000)}`;
const id = createId(['Org1MSP', 'Admin@org1.example.com']);
const entityName = 'ngac_service_test';
const entityId = 'entity_id_1001';

beforeAll(async () => {
  const config = await bootstrap(identity);
  network = config.network;
  gateway = config.gateway;
});

afterAll(async () => await gateway.disconnect());

describe('Ngac CRUD Integration Tests', () => {
  it('should getMSPAttrByMSPID', async () =>
    evaluateNgac('getMSPAttrByMSPID', ['Org1MSP'], {
      network
    }).then(attributes =>
      expect(attributes).toEqual([
        { type: '1', key: 'mspid', value: 'Org1MSP' }
      ])
    ));

  it('should getResourceAttrByURI', async () =>
    evaluateNgac('getResourceAttrByURI', ['model/Org1MSP/ngactest'], {
      network
    }).then(attributes => expect(attributes).toMatchSnapshot()));

  it('should getPolicyById', async () =>
    evaluateNgac('getPolicyById', [id], { network }).then(
      (policies: Policy[]) =>
        policies.forEach(({ key }) =>
          expect(key.startsWith(JSON.stringify(id))).toBe(true)
        )
    ));

  it('should getPolicyByIdSid', async () =>
    evaluateNgac('getPolicyByIdSid', [id, 'allowCreateTest'], { network }).then(
      policy => expect(policy).toMatchSnapshot()
    ));

  it('should addPolicy', async () => {
    const pClass = 'service-ngac-crud-policy';
    const sid = 'allowSvsCreate';
    const url = 'model/Org1MSP/service_ngac_crud_test/crud_int_001';
    const events = ['ServiceNgacCRUDTestCreated'];
    await submitNgac(
      'addPolicy',
      [pClass, sid, url, JSON.stringify(events), ''],
      {
        network
      }
    ).then(policy => expect(policy.sid).toEqual(sid));
  });

  it('should deletePolicyByIdSid', async () =>
    submitNgac('deletePolicyByIdSid', [id, 'allowSvsCreate'], {
      network
    }).then(({ status }) => expect(status).toEqual('SUCCESS')));

  it('should addMSPAttr', async () => {
    const mspAttr = [{ type: '1', key: 'mspid', value: 'Org100MSP' }];
    await submitNgac('addMSPAttr', ['Org100MSP', JSON.stringify(mspAttr)], {
      network
    }).then(attributes => expect(attributes).toEqual(mspAttr));
  });

  it('should deleteMSPAttrByMSPID', async () =>
    submitNgac('deleteMSPAttrByMSPID', ['Org100MSP'], { network }).then(
      result =>
        expect(result).toEqual({
          status: 'SUCCESS',
          message: 'Org100MSP is successfully deleted'
        })
    ));

  it('should addResourceAttr', async () => {
    // note: this api use submitter's mspId, instead of input argument
    // Todo: may require to visit if this behaviour is correct.
    const resourceAttr = [{ type: '1', key: 'creatTest', value: 'any value' }];
    await submitNgac(
      'addResourceAttr',
      [entityName, entityId, JSON.stringify(resourceAttr)],
      {
        network
      }
    ).then(attributes => expect(attributes).toEqual(resourceAttr));
    await evaluateNgac(
      'getResourceAttrByURI',
      [`model/Org1MSP/${entityName}/${entityId}`],
      {
        network
      }
    ).then(attributes => expect(attributes).toEqual(resourceAttr));
  });

  it('should upsertResourceAttr', async () => {
    const resourceAttr = [{ type: '1', key: 'username', value: 'bob' }];
    const expectedResult = [
      { type: '1', key: 'creatTest', value: 'any value' },
      { type: '1', key: 'username', value: 'bob' }
    ];
    await submitNgac(
      'upsertResourceAttr',
      [entityName, entityId, JSON.stringify(resourceAttr)],
      { network }
    ).then(attributes => expect(attributes).toEqual(expectedResult));
    await evaluateNgac(
      'getResourceAttrByURI',
      [`model/Org1MSP/${entityName}/${entityId}`],
      {
        network
      }
    ).then(attributes => expect(attributes).toEqual(expectedResult));
  });

  it('should deleteReourceAttrByURI', async () => {
    await submitNgac(
      'deleteReourceAttrByURI',
      [`model/Org1MSP/${entityName}/${entityId}`],
      { network }
    ).then(({ status }) => expect(status).toEqual('SUCCESS'));
    await evaluateNgac(
      'getResourceAttrByURI',
      [`model/Org1MSP/${entityName}/${entityId}`],
      {
        network
      }
    ).then(attributes => expect(attributes).toEqual({}));
  });
});
