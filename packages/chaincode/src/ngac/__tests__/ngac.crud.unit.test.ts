import { ngacRepo } from '../ngacRepo';
import { NAMESPACE } from '../types';
import { createPolicy } from '../utils';
import { mspAttributeDb, policyDb, resourceAttributeDb } from './__utils__';

jest.mock('../ledger-api/statelist');

const context: any = {
  resourceAttributeDb,
  mspAttributeDb,
  policyDb
};

const x509id =
  'x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca';
const sid = 'allowCreateDocument';
const mspid = 'Org1MSP';
const uri = 'model/Org1MSP/dev_ngac_example1';
const policy = createPolicy({
  context,
  policyClass: 'unit-test',
  sid: 'allowCreateTrade',
  allowedEvents: ['TradeCreated'],
  uri: `${NAMESPACE.MODEL}/Org0MSP/trade/trade_unit_01`
});

describe('NgacRepo Tests', () => {
  // based on statelist/getQueryResult
  it('should getPolicyById by x509id', async () =>
    await ngacRepo(context)
      .getPolicyById(x509id)
      .then(policies =>
        policies.forEach(({ policyClass }) =>
          expect(policyClass).toBe('event-creation')
        )
      ));

  it('should fail getPolicyById: wrong x509id', async () =>
    await ngacRepo(context)
      .getPolicyById('incorrect x509id')
      .then(policies => expect(policies).toEqual([])));

  it('should getPolicyByIdSid, by x509id, statement id', async () =>
    // based on stateList/getState
    await ngacRepo(context)
      .getPolicyByIdSid(x509id, sid)
      .then(({ sid }) => expect(sid).toBe('allowCreateDocument')));

  it('should fail getPolicyByIdSid: wrong x509id', async () =>
    await ngacRepo(context)
      .getPolicyByIdSid('incorrect x509id', sid)
      .then(policy => expect(policy).toEqual([])));

  it('should fail getPolicyByIdSid: wrong sid', async () =>
    await ngacRepo(context)
      .getPolicyByIdSid(x509id, 'incorrect sid')
      .then(policy => expect(policy).toEqual([])));

  it('should getMSPAttrByMSPID, by mspid', async () =>
    await ngacRepo(context)
      .getMSPAttrByMSPID(mspid)
      .then(attributes =>
        expect(attributes).toEqual([
          { type: '1', key: 'mspid', value: 'Org1MSP' }
        ])
      ));

  it('should fail getMSPAttrByMSPID: wrong mspid', async () =>
    await ngacRepo(context)
      .getMSPAttrByMSPID('incorrect mspid')
      .then(attributes => expect(attributes).toEqual([])));

  it('should getResourceAttrByURI', async () =>
    await ngacRepo(context)
      .getResourceAttrByURI(uri)
      .then(attributes => expect(attributes[0].key).toEqual('createDocument')));

  it('should fail getResourceAttrByURI: wrong uri', async () =>
    await ngacRepo(context)
      .getResourceAttrByURI('incorrect-uri')
      .then(attributes => expect(attributes).toEqual([])));

  it('should addPolicy', async () =>
    await ngacRepo(context)
      .addPolicy(policy)
      .then(result => console.log(result)));
});
