import { permissionCheck } from '../permissionCheck';
import { createId } from '../utils';
import { mspAttributeDb, policyDb, resourceAttributeDb } from './__utils__';

jest.mock('../ledger-api/statelist');

const context: any = {
  stub: {
    getFunctionAndParameters: jest.fn()
  },
  clientIdentity: {
    getMSPID: jest.fn(),
    getID: jest.fn(),
    getX509Certificate: jest.fn()
  },
  resourceAttributeDb,
  mspAttributeDb,
  policyDb
};
let entityName;
let entityId;
let version;
let eventStr;
let id;

describe('Example 2: PolicyEngine Tests', () => {
  beforeEach(() => {
    entityName = 'dev_ngac_example2';
    entityId = 'ngac_unit_02';
    version = '1';
    eventStr = JSON.stringify([{ type: 'UsernameUpdated' }]);
    // id = 'x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca';
    id = createId(['Org1MSP', 'Admin@example.com']);
    context.stub.getFunctionAndParameters.mockImplementation(() => ({
      fcn: 'createCommit',
      params: [entityName, entityId, version, eventStr]
    }));
    context.clientIdentity.getID.mockImplementation(() => id);
    context.clientIdentity.getMSPID.mockImplementation(() => 'Org1MSP');
    context.clientIdentity.getX509Certificate.mockImplementation(() => ({
      subject: { commonName: 'Admin@example.com' },
      issuer: { commonName: 'rca-org1' }
    }));
  });

  // policy found, createCommit for pre-existing entity.
  it('2a: should updateUsername', async () =>
    permissionCheck({ context }).then(assertions =>
      expect(assertions).toEqual([
        { sid: 'allowUpdateUsername', assertion: true }
      ])
    ));

  it('2b: should fail updateUsername with wrong ID, , when his policy exists', async () => {
    context.clientIdentity.getX509Certificate.mockImplementation(() => ({
      subject: { commonName: 'wrong@example.com' },
      issuer: { commonName: 'rca-org1' }
    }));
    return permissionCheck({ context }).then(assertions =>
      expect(assertions).toEqual([
        { sid: 'system', assertion: false, message: 'No policy found' }
      ])
    );
  });

  it('2d: should fail updateUsername with non-existing mspid', async () => {
    context.clientIdentity.getMSPID.mockImplementation(() => 'wrong-mspid');
    return permissionCheck({ context }).then(assertions =>
      expect(assertions).toEqual([
        {
          sid: 'system',
          assertion: false,
          message: `No resource found`
        }
      ])
    );
  });
});
