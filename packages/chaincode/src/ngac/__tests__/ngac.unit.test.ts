import { permissionCheck } from '../permissionCheck';

jest.mock('../ledger-api/statelist');

const context: any = {
  stub: {
    getFunctionAndParameters: jest.fn()
  },
  clientIdentity: {
    getMSPID: jest.fn(),
    getID: jest.fn(),
    getX509Certificate: jest.fn()
  }
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
  { type: '1', key: 'version', value: '0', immutable: false },
  { type: '1',
    key: 'entityName',
    value: 'dev_ngac_example1',
    immutable: true },
  { type: '1',
    key: 'entityId',
    value: 'ngac_unit_01',
    immutable: true },
  { type: '1',
    key: 'creator_mspid',
    value: 'Org1MSP',
    immutable: true },
  { type: '1',
    key: 'creator_cn',
    value: 'Admin@org1.example.com',
    immutable: true },
  { type: '1',
    key: 'creator_id',
    value: 'x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca',
    immutable: true } ]
 */
describe('Example 1: Tests', () => {
  beforeEach(() => {
    entityName = 'dev_ngac_example1';
    entityId = 'ngac_unit_01';
    version = '0';
    eventStr = JSON.stringify([{ type: 'DocumentCreated' }]);
    id = 'x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca';
    context.stub.getFunctionAndParameters.mockImplementation(() => ({
      fcn: 'createCommit',
      params: [entityName, entityId, version, eventStr]
    }));
    context.clientIdentity.getID.mockImplementation(() => id);
  });

  // policy found and asserted
  it('1a: should createDocument', async () =>
    await permissionCheck({ context }).then(assertions =>
      expect(assertions).toEqual([
        { sid: 'allowCreateDocument', assertion: true }
      ])
    ));

  // policy not found at all
  it('1b: should fail updateDocument, which is not allowedEvents', async () => {
    context.stub.getFunctionAndParameters.mockImplementationOnce(() => ({
      fcn: 'createCommit',
      params: [
        entityName,
        entityId,
        version,
        JSON.stringify([{ type: 'DocumentUpdated' }])
      ]
    }));
    return permissionCheck({ context }).then(assertions =>
      expect(assertions).toEqual([])
    );
  });

  // policy found, but assert false
  it('1c: should fail createDocument with wrong ID, when his policy exists', async () => {
    context.clientIdentity.getID.mockImplementationOnce(
      () => 'wrong id + valid policy'
    );
    return permissionCheck({ context }).then(assertions =>
      expect(assertions).toEqual([
        { sid: 'allowCreateDocument', assertion: false }
      ])
    );
  });

  // policy found, but assert false
  it('1d: should fail createDocument with wrong ID, when his policy not exist', async () => {
    context.clientIdentity.getID.mockImplementationOnce(
      () => 'wrong id; without valid policy'
    );
    return permissionCheck({ context }).then(assertions =>
      expect(assertions).toEqual([
        { sid: 'system', assertion: false, message: 'No policy found' }
      ])
    );
  });

  // Policy found, but missing resource attributes cannot proceed assertion
  it('1e: should fail getResourceAttr', async () => {
    context.stub.getFunctionAndParameters.mockImplementationOnce(() => ({
      fcn: 'createCommit',
      params: ['non-existing entityName', entityId, version, eventStr]
    }));
    return permissionCheck({ context }).then(assertions =>
      expect(assertions).toEqual([
        {
          sid: 'allowCreateDocument',
          assertion: false,
          message: 'Cannot find resource attributes'
        }
      ])
    );
  });

  // Policy found, any MSPID's member is allowed
  it('1f: should fail createDocument with wrong mspid', async () => {
    context.clientIdentity.getMSPID.mockImplementationOnce(() => 'Org2MSP');
    return permissionCheck({ context }).then(assertions =>
      expect(assertions).toEqual([
        {
          sid: 'allowCreateDocument',
          assertion: true
        }
      ])
    );
  });
});

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
});
