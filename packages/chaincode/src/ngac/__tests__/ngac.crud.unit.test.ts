import { ngacRepo } from '../ngacRepo';
import { NAMESPACE, Policy } from '../types';
import { createPolicy, createResource } from '../utils';
import { createMSPResource } from '../utils/createMSPResource';
import { mspAttributeDb, policyDb, resourceAttributeDb } from './__utils__';

jest.mock('../ledger-api/statelist');

const context: any = {
  clientIdentity: {
    getMSPID: jest.fn(),
    getID: jest.fn(),
    getX509Certificate: jest.fn()
  },
  resourceAttributeDb,
  mspAttributeDb,
  policyDb
};

const x509id =
  'x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca';
const sid = 'allowCreateDocument';
const mspid = 'Org1MSP';
const uri = 'model/Org1MSP/dev_ngac_example1';
context.clientIdentity.getMSPID.mockImplementation(() => 'Org1MSP');
context.clientIdentity.getX509Certificate.mockImplementation(() => ({
  subject: { commonName: 'Admin@org1.example.com' },
  issuer: { commonName: 'rca-org1' }
}));

describe('NgacRepo CRUD Tests', () => {
  beforeEach(() => {
    context.clientIdentity.getID.mockImplementation(() => x509id);
  });

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

  it('should addPolicy', async () => {
    const policy = createPolicy({
      context,
      policyClass: 'unit-test',
      sid: 'allowCreateTrade',
      allowedEvents: ['TradeCreated'],
      uri: `${NAMESPACE.MODEL}/Org0MSP/trade/trade_unit_01`
    });
    let policyAdded: Policy;
    await ngacRepo(context)
      .addPolicy(policy)
      .then(policy => {
        policyAdded = policy;
        expect(policy).toMatchSnapshot();
      });
    await ngacRepo(context)
      .getPolicyByIdSid(x509id, policy.sid)
      .then(policy => expect(policy).toEqual(policyAdded));
  });

  it('should deletePolicyByIdSid', async () => {
    await ngacRepo(context)
      .deletePolicyByIdSid(x509id, 'allowCreateTrade')
      .then(keyDeleted =>
        expect(keyDeleted).toBe(
          '"x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca""allowCreateTrade"'
        )
      );
    await ngacRepo(context)
      .getPolicyByIdSid(x509id, 'allowCreateTrade')
      .then(policy => expect(policy).toEqual([]));
  });

  it('should deletePolicyById', async () => {
    const id01 = 'id-deletePolicyById';
    context.clientIdentity.getID.mockImplementation(() => id01);
    const policy1 = createPolicy({
      context,
      policyClass: 'unit-test',
      sid: 'allowCreateLoan',
      allowedEvents: ['LoanCreated'],
      uri: `${NAMESPACE.MODEL}/Org0MSP/loan/loan_unit_01`
    });
    const policy2 = createPolicy({
      context,
      policyClass: 'unit-test',
      sid: 'allowSignature',
      allowedEvents: ['Signed'],
      uri: `${NAMESPACE.MODEL}/Org0MSP/loan/loan_unit_01`
    });
    let policy1Added: Policy;
    let policy2Added: Policy;

    await ngacRepo(context)
      .addPolicy(policy1)
      .then(policy => (policy1Added = policy));

    await ngacRepo(context)
      .addPolicy(policy2)
      .then(policy => (policy2Added = policy));

    await ngacRepo(context)
      .deletePolicyById(id01)
      .then(keysDeleted =>
        expect(keysDeleted).toEqual([
          '"id-deletePolicyById""allowCreateLoan"',
          '"id-deletePolicyById""allowSignature"'
        ])
      );
  });

  it('should addMSPAttr', async () => {
    const mspId = 'Org0MSP';
    const mspAttrs = [{ type: '1', key: 'mspid', value: 'Org0MSP' }];
    const mspResource = createMSPResource({ context, mspId, mspAttrs });
    let mspAttrAdded;
    await ngacRepo(context)
      .addMSPAttr(mspResource)
      .then(attrs => {
        mspAttrAdded = attrs;
        expect(attrs).toEqual(mspAttrs);
      });
    await ngacRepo(context)
      .getMSPAttrByMSPID('Org0MSP')
      .then(attrs => expect(attrs).toEqual(mspAttrs));
  });

  it('should deleteMSPAttrByMSPID', async () => {
    await ngacRepo(context)
      .deleteMSPAttrByMSPID('Org0MSP')
      .then(result => expect(result).toEqual('"Org0MSP"'));
    await ngacRepo(context)
      .getMSPAttrByMSPID('Org0MSP')
      .then(attrs => expect(attrs).toEqual([]));
  });

  it('should addResourceAttr', async () => {
    const entityName = 'Trade';
    const entityId = 'unit_test_1010';
    const resourceAttrs = [{ type: '1', key: 'owner', value: 'me' }];
    const resource = createResource({
      context,
      entityId,
      entityName,
      resourceAttrs
    });
    await ngacRepo(context)
      .addResourceAttr(resource)
      .then(attrs => expect(attrs).toEqual(resourceAttrs));

    await ngacRepo(context)
      .getResourceAttrByURI(resource.uri)
      .then(attrs => expect(attrs).toEqual(resourceAttrs));
  });

  it('should deleteReourceAttrByURI', async () => {
    const uri = `model/Org1MSP/Trade/unit_test_1010`;
    await ngacRepo(context)
      .deleteReourceAttrByURI(uri)
      .then(key =>
        expect(key).toEqual(['"model""Org1MSP""Trade""unit_test_1010"'])
      );
    await ngacRepo(context)
      .getResourceAttrByURI(uri)
      .then(attrs => expect(attrs).toEqual([]));
  });
});
