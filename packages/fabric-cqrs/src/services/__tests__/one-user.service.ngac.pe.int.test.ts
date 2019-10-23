import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env.ngac.org2.test') });

import { Gateway, Network } from 'fabric-network';
import { omit, pick, values } from 'lodash';
import { createId } from '../../createId';
import { bootstrap } from '../../ngac_test/registerUserOrg2';
import { Attribute, Commit, CONTEXT, RESOURCE } from '../../types';
import { submit } from '../submit';
import submitNgac from '../submitNgac';

let network: Network;
let gateway: Gateway;

const identity = `svs_org2_pe_test${Math.floor(Math.random() * 1000)}`;

beforeAll(async () => {
  const ctx = await bootstrap(identity);
  network = ctx.network;
  gateway = ctx.gateway;
});

afterAll(async () => await gateway.disconnect());

const mspId = 'Org2MSP';
const entityName = 'doc';
const entityId = `doc_0_${Math.floor(Math.random() * 10000)}`;
const eventsStr = JSON.stringify([
  { type: 'DocCreated', payload: { data: 'Mydata' } }
]);
const mspAttrs = [{ type: '1', key: 'mspid', value: mspId }];
const pClass = 'ngac-pe-policy';
const sid = 'allowCreateDoc';
const url = `model/${mspId}/${entityName}`;
const condition = JSON.stringify({ hasList: { createDoc: 'creator_id' } });
const allowedEvents = JSON.stringify(['DocCreated']);
const id = createId([mspId, 'Admin@org2.example.com']);
const resourceAttr = [{ type: '1', key: 'createDoc', value: id }];

describe('Ngac Permission Tests', () => {
  it('should pass permission check', async () => {
    // create Org2MSP attribute
    await submitNgac('addMSPAttr', [mspId, JSON.stringify(mspAttrs)], {
      network
    }).then(attributes => expect(attributes).toMatchSnapshot());

    // should create policy
    await submitNgac(
      'addPolicy',
      [pClass, sid, url, allowedEvents, condition],
      {
        network
      }
    )
      .then(policy => omit(policy, 'key'))
      .then(policy => expect(policy).toMatchSnapshot());

    // create resource attributes for entityName
    await submitNgac(
      'addResourceAttr',
      [entityName, '', JSON.stringify(resourceAttr)],
      { network }
    ).then(attributes => expect(attributes).toMatchSnapshot());

    // should createDoc
    await submit('createCommit', [entityName, entityId, '0', eventsStr], {
      network
    })
      .then<Commit>(result => values(result)[0])
      .then(commit => pick(commit, 'entityName', 'version', 'events'))
      .then(commit => expect(commit).toMatchSnapshot());
  });
});

describe('Permission Test 2', () => {
  it('should should pass the test, for existing entityId', async () => {
    // create policy 2
    const sid = 'allowUpadateDoc';
    const url = `model/${mspId}/${entityName}/${entityId}`;
    const allowedEvents = JSON.stringify(['DocUpdated']);
    const condition = JSON.stringify({
      hasList: { updateDoc: RESOURCE.CREATOR_ID },
      stringEquals: { [CONTEXT.INVOKER_MSPID]: RESOURCE.CREATOR_MSPID }
    });
    await submitNgac(
      'addPolicy',
      [pClass, sid, url, allowedEvents, condition],
      {
        network
      }
    )
      .then(policy => omit(policy, 'key'))
      .then(policy => expect(policy).toMatchSnapshot());

    // upsert resourceAttribute of updateDoc
    const attr = JSON.stringify([{ type: 'N', key: 'updateDoc', value: [id] }]);
    await submitNgac('upsertResourceAttr', [entityName, entityId, attr], {
      network
    })
      .then((attributes: Attribute[]) =>
        attributes.filter(({ key }) => key === 'updateDoc')
      )
      .then(attributes => attributes[0])
      .then(({ value }) => expect(value).toEqual([id]));

    // updateDoc
    const eventsStr = JSON.stringify([
      { type: 'DocUpdated', payload: { data: 'mydoc' } }
    ]);
    await submit('createCommit', [entityName, entityId, '1', eventsStr], {
      network
    })
      .then<Commit>(result => values(result)[0])
      .then(commit => pick(commit, 'entityName', 'version', 'events'))
      .then(commit =>
        expect(commit).toEqual({
          entityName,
          version: 1,
          events: [{ type: 'DocUpdated', payload: { data: 'mydoc' } }]
        })
      );
  });
});

describe('Rejected Permission Test', () => {
  it('should createNothing, when policy found', async () => {
    const eventsStr = JSON.stringify([{ type: 'NothingCreated' }]);
    const entityId = `doc_1_${Math.floor(Math.random() * 10000)}`;
    return submit('createCommit', [entityName, entityId, '0', eventsStr], {
      network
    }).then(({ error }) => expect(error.message).toContain('No policy found'));
  });
});
