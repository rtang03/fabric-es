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
  it('Example 1a: should createDocument', async () =>
    await permissionCheck({ context }).then(assertions =>
      expect(assertions).toEqual([
        { sid: 'allowCreateDocument', assertion: true }
      ])
    ));

  // policy not found at all
  it('Example 1b: should fail to updateDocument', async () => {
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
  it('Example 1c: should fail to createDocument with wrong ID', async () => {
    context.clientIdentity.getID.mockImplementationOnce(() => 'invalid-id');
    return permissionCheck({ context }).then(assertions =>
      expect(assertions).toEqual([
        { sid: 'allowCreateDocument', assertion: false }
      ])
    );
  });

  // Policy found, but missing resource attributes cannot proceed assertion
  it('Example 1d: should fail to getResourceAttr', async () => {
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
  it('Example 1e: should fail to createDocument with wrong mspid', async () => {
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
  it('Example 2a: should updateUsername', async () =>
    await permissionCheck({ context }).then(assertions =>
      expect(assertions).toEqual([
        { sid: 'allowUpdateUsername', assertion: true }
      ])
    ));

  it('Example 2b: should fail updateUsername, with wrong id', async () => {
    context.clientIdentity.getID.mockImplementationOnce(() => 'wrong id');
    return permissionCheck({ context }).then(assertions =>
      expect(assertions).toEqual([
        { sid: 'allowUpdateUsername', assertion: false }
      ])
    );
  });
});
