import { permissionCheck } from '../permissionCheck';
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
context.clientIdentity.getMSPID.mockImplementation(() => 'Org1MSP');
context.clientIdentity.getX509Certificate.mockImplementation(() => ({
  subject: { commonName: 'Admin@org1.example.com' },
  issuer: { commonName: 'rca-org1' }
}));

/* target.resourceAttrs
[ { type: '1',
    key: 'invoker_mspid',
    value: 'Org1MSP',
    immutable: true },
  { type: '1',
    key: 'invoker_id',
    value: 'x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca',
    immutable: true },
  { type: '1',
    key: 'subject_cn',
    value: 'Admin@org1.example.com',
    immutable: true },
  { type: '1', key: 'version', value: '1', immutable: false },
  { type: '1',
    key: 'entityName',
    value: 'dev_ngac_example2',
    immutable: true },
  { type: '1',
    key: 'entityId',
    value: 'ngac_unit_02',
    immutable: true },
  { type: 'N',
    key: 'updateUsername',
    value:
     [ 'x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca',
       'x509::/O=Dev/OU=client/CN=User1@example.com::/O=Dev/OU=Dev/CN=rca' ] },
  { type: '1', key: 'entityId', value: 'ngac_unit_02' },
  { type: '1', key: 'creator_mspid', value: 'Org1MSP' },
  { type: '1', key: 'entityName', value: 'dev_ngac_example2' } ]
 */
describe('Example 2: Tests', () => {
  beforeEach(() => {
    entityName = 'dev_ngac_example2';
    entityId = 'ngac_unit_02';
    version = '1';
    eventStr = JSON.stringify([{ type: 'UsernameUpdated' }]);
    id = 'x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca';
    context.stub.getFunctionAndParameters.mockImplementation(() => ({
      fcn: 'createCommit',
      params: [entityName, entityId, version, eventStr]
    }));
    context.clientIdentity.getID.mockImplementation(() => id);
  });

  // policy found, createCommit for pre-existing entity.
  it('2a: should updateUsername', async () =>
    await permissionCheck({ context }).then(assertions =>
      expect(assertions).toEqual([
        { sid: 'allowUpdateUsername', assertion: true }
      ])
    ));

  it('2b: should fail updateUsername with wrong ID, , when his policy exists', async () => {
    context.clientIdentity.getID.mockImplementation(
      () => 'wrong id + valid policy'
    );
    return permissionCheck({ context }).then(assertions =>
      expect(assertions).toEqual([
        { sid: 'allowUpdateUsername', assertion: false }
      ])
    );
  });

  it('2c: should fail updateUsername with wrong ID, , when his policy not exists', async () => {
    context.clientIdentity.getID.mockImplementationOnce(
      () => 'wrong id; without valid policy'
    );
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
