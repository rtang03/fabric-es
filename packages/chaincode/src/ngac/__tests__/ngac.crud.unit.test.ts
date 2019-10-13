import { ngacRepo } from '../ngacRepo';
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

describe('NgacRepo Tests', () => {
  // based on statelist/getQueryResult
  it('should get policies by x509id', async () =>
    await ngacRepo(context)
      .getPolicyById(x509id)
      .then(policies =>
        policies.forEach(({ policyClass }) =>
          expect(policyClass).toBe('event-creation')
        )
      ));

  it('should get policy by x509id & sid', async () =>
    // based on stateList/getState
    await ngacRepo(context)
      .getPolicyByIdSid(x509id, sid)
      .then(({ sid }) => expect(sid).toBe('allowCreateDocument')));

  it('should get MSP attribute by mspid', async () =>
    await ngacRepo(context).getMSPAttrByMSPID(mspid));
});
