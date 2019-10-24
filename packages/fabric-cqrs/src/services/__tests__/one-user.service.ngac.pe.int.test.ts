import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env.ngac.org2.test') });

import { Gateway, Network } from 'fabric-network';
import { omit, pick, values } from 'lodash';
import { createId } from '../../createId';
import { bootstrap } from '../../ngac_test/registerUserOrg2';
import { Attribute, Commit, CONTEXT, RESOURCE } from '../../types';
import evaluateNgac from '../evaluateNgac';
import { submit } from '../submit';
import submitNgac from '../submitNgac';

let network: Network;
let gateway: Gateway;
let fakerNetwork: Network;
let fakerGateway: Gateway;

const identity = `svs_org2_pe_test${Math.floor(Math.random() * 10000)}`;
const faker = `faker_${Math.floor(Math.random() * 10000)}`;

beforeAll(async () => {
  const ctx = await bootstrap(identity);
  network = ctx.network;
  gateway = ctx.gateway;
  const fakerCtx = await bootstrap(faker);
  fakerNetwork = fakerCtx.network;
  fakerGateway = fakerCtx.gateway;
});

afterAll(async () => {
  await gateway.disconnect();
  await fakerGateway.disconnect();
});

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
const id = createId([mspId, identity]);
const resourceAttr = [{ type: '1', key: 'createDoc', value: id }];

describe('Ngac Permission Tests', () => {
  it('should pass permission check', async () => {
    // create Org2MSP attribute
    await submitNgac('addMSPAttr', [mspId, JSON.stringify(mspAttrs)], {
      network
    }).then(attributes => expect(attributes).toEqual(mspAttrs));

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
    ).then(attributes => expect(attributes).toEqual(resourceAttr));

    // should createDoc
    await submit('createCommit', [entityName, entityId, '0', eventsStr], {
      network
    })
      .then<Commit>(result => values(result)[0])
      .then(commit => pick(commit, 'entityName', 'version', 'events'))
      .then(commit =>
        expect(commit).toEqual({
          entityName,
          version: 0,
          events: [{ type: 'DocCreated', payload: { data: 'Mydata' } }]
        })
      );
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
      stringEquals: {
        [CONTEXT.INVOKER_MSPID]: RESOURCE.CREATOR_MSPID,
        [CONTEXT.INVOKER_ID]: RESOURCE.CREATOR_ID
      }
    });
    await submitNgac(
      'addPolicy',
      [pClass, sid, url, allowedEvents, condition],
      {
        network
      }
    )
      .then(policy => omit(policy, 'key', 'attributes'))
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
  it('should fail createNothing, when no policy found', async () =>
    submit(
      'createCommit',
      [
        entityName,
        `doc_1_${Math.floor(Math.random() * 10000)}`,
        '0',
        JSON.stringify([{ type: 'NothingCreated' }])
      ],
      {
        network
      }
    ).then(({ error: { message } }) =>
      expect(message).toContain('No policy found')
    ));
});

describe('NGAC CRUD query', () => {
  it('should getMSPAttrByMSPID', async () =>
    evaluateNgac('getMSPAttrByMSPID', [mspId], { network }).then(attrs =>
      expect(attrs).toEqual([{ type: '1', key: 'mspid', value: 'Org2MSP' }])
    ));

  it('should getResourceAttrByURI', async () => {
    await evaluateNgac(
      'getResourceAttrByURI',
      [`model/Org2MSP/${entityName}`],
      { network }
    ).then(attrs =>
      expect(attrs).toEqual([{ type: '1', key: 'createDoc', value: id }])
    );

    // Below is tested working, but keep comment out, for simplicity
    // await evaluateNgac(
    //   'getResourceAttrByURI',
    //   [`model/Org2MSP/${entityName}/${entityId}`],
    //   { network }
    // ).then(result => console.log(result));

    // Below is tested working, but keep comment out, for simplicity
    // await evaluateNgac('getPolicyById', [id], {
    //   network
    // }).then(result => console.log(result));
  });
});

describe('Permission Test 3', () => {
  it('should fail updateDoc within unauthorized user', async () => {
    const network = fakerNetwork;
    const eventsStr = JSON.stringify([
      { type: 'DocUpdated', payload: { data: 'update me again' } }
    ]);

    await submit('createCommit', [entityName, entityId, '2', eventsStr], {
      network
    }).then(({ error: { message } }) =>
      expect(message).toContain('No policy found')
    );

    // should fail because stringEquals requires that
    // only invoker must be resource creator
    const sid = 'allowUpadateDoc';
    const url = `model/${mspId}/${entityName}/${entityId}`;
    const allowedEvents = JSON.stringify(['DocUpdated']);
    let condition = JSON.stringify({
      // hasList is optional
      hasList: { updateDoc: RESOURCE.CREATOR_ID },
      stringEquals: {
        [CONTEXT.INVOKER_MSPID]: RESOURCE.CREATOR_MSPID,
        // below statement guards the permission
        // if remove, anyone can invoke updateDoc
        // todo: add new function in chaincode for update and upsert policy
        [CONTEXT.INVOKER_ID]: RESOURCE.CREATOR_ID
      }
    });
    await submitNgac(
      'addPolicy',
      [pClass, sid, url, allowedEvents, condition],
      {
        network
      }
    );

    await submit('createCommit', [entityName, entityId, '2', eventsStr], {
      network
    }).then(({ error: { message } }) =>
      expect(message).toContain(`"allowUpadateDoc" assertion fails`)
    );

    // should pass
    condition = JSON.stringify({
      stringEquals: {
        [CONTEXT.INVOKER_MSPID]: RESOURCE.CREATOR_MSPID,
      }
    });
    await submitNgac(
      'addPolicy',
      [pClass, sid, url, allowedEvents, condition],
      {
        network
      }
    );
  });
});
