import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../.env.ngac.org2.test') });

import { Gateway, Network } from 'fabric-network';
import { omit } from 'lodash';
import { createId } from '../../account';
import { bootstrap } from '../../ngac_test/registerUserOrg2';
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
const entityId = 'doc_0001';
const mspAttrs = [{ type: '1', key: 'mspid', value: mspId }];
const pClass = 'ngac-pe-policy';
const sid = 'allowCreateDoc';
const url = `model/${mspId}/${entityName}`;
const condition = { hasList: { createDoc: 'creator_id' } };
const allowedEvents = ['DocCreated'];
const id = createId([mspId, 'Admin@org2.example.com']);
const resourceAttr = [{ type: '1', key: 'createDoc', value: id }];

describe('Ngac Permission Tests', () => {
  describe('prepare Ngac environment', () => {
    it('should create Org2MSP attribute', async () =>
      submitNgac('addMSPAttr', [mspId, JSON.stringify(mspAttrs)], {
        network
      }).then(attributes => expect(attributes).toMatchSnapshot()));

    it('should create policy', async () =>
      submitNgac(
        'addPolicy',
        [
          pClass,
          sid,
          url,
          JSON.stringify(allowedEvents),
          JSON.stringify(condition)
        ],
        { network }
      )
        .then(policy => omit(policy, 'key'))
        .then(policy => expect(policy).toMatchSnapshot()));

    it('should create resource attributes for entityName', async () =>
      submitNgac(
        'addResourceAttr',
        [entityName, '', JSON.stringify(resourceAttr)],
        { network }
      ).then(attributes => expect(attributes).toMatchSnapshot()));
  });

  // describe('perform Policy Decision Check', () => {
  //   it('should', async () => {});
  // });
});
