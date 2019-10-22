import { Gateway, Network } from 'fabric-network';
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
const mspAttrs = [{ type: '1', key: 'mspid', value: 'Org2MSP' }];
const pClass = 'ngac-pe-policy';
const sid = 'allowCreateDoc';
const url = `model/${mspId}/${entityName}`;
const condition = { hasList: { createDoc: 'creator_id' } };
const allowedEvents = ['DocCreated'];
const x509id =
  'x509::/C=US/ST=North Carolina/O=Hyperledger/OU=client/CN=Admin@org1.example.com::/C=US/ST=North Carolina/O=Hyperledger/OU=Fabric/CN=rca-org1';
const resourceAttr = [{ type: 'N', key: 'createDoc', value: [x509id] }];

describe('Ngac Permission Tests', () => {
  describe('prepare Ngac environment', () => {
    it('should create Org2MSP attribute', async () =>
      submitNgac('addMSPAttr', [mspId, JSON.stringify(mspAttrs)], {
        network
      }).then(attributes => console.log(attributes)));

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
      ).then(policy => console.log(policy)));

    it('should create resource attributes for entityName', async () =>
      submitNgac(
        'addResourceAttr',
        [entityName, '', JSON.stringify(resourceAttr)],
        { network }
      ).then(attributes => console.log(attributes)));
  });
});
