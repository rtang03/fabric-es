import { permissionCheck } from '../permissionCheck';

jest.mock('../ledger-api/statelist');

const ctx = {
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
ctx.clientIdentity.getMSPID.mockImplementation(() => 'Org1MSP');
ctx.clientIdentity.getX509Certificate.mockImplementation(() => ({
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
  });
  // policy found and asserted
  it('Example 1a: should createDocument', async () => {
    ctx.stub.getFunctionAndParameters.mockImplementationOnce(() => ({
      fcn: 'createCommit',
      params: [entityName, entityId, version, eventStr]
    }));
    ctx.clientIdentity.getID.mockImplementationOnce(() => id);
    return permissionCheck(ctx as any).then(assertions =>
      expect(assertions).toEqual([
        { sid: 'allowCreateDocument', assertion: true }
      ])
    );
  });

  // policy not found at all
  it('Example 1b: should fail to updateDocument', async () => {
    eventStr = JSON.stringify([{ type: 'DocumentUpdated' }]);
    ctx.stub.getFunctionAndParameters.mockImplementationOnce(() => ({
      fcn: 'createCommit',
      params: [entityName, entityId, version, eventStr]
    }));
    ctx.clientIdentity.getID.mockImplementationOnce(() => id);
    return permissionCheck(ctx as any).then(assertions =>
      expect(assertions).toEqual([])
    );
  });

  // policy found, but assert false
  it('Example 1c: should fail to createDocument with wrong ID', async () => {
    ctx.stub.getFunctionAndParameters.mockImplementationOnce(() => ({
      fcn: 'createCommit',
      params: [entityName, entityId, version, eventStr]
    }));
    ctx.clientIdentity.getID.mockImplementationOnce(() => 'invalid-id');
    return permissionCheck(ctx as any).then(assertions =>
      expect(assertions).toEqual([
        { sid: 'allowCreateDocument', assertion: false }
      ])
    );
  });

  // Policy found, but missing resource attributes cannot proceed assertion
  it('Example 1d: should fail to getResourceAttr', async () => {
    ctx.stub.getFunctionAndParameters.mockImplementationOnce(() => ({
      fcn: 'createCommit',
      params: ['non-existing entityName', entityId, version, eventStr]
    }));
    ctx.clientIdentity.getID.mockImplementationOnce(() => id);
    return permissionCheck(ctx as any).then(assertions =>
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
    ctx.stub.getFunctionAndParameters.mockImplementationOnce(() => ({
      fcn: 'createCommit',
      params: [entityName, entityId, version, eventStr]
    }));
    ctx.clientIdentity.getID.mockImplementationOnce(() => id);
    ctx.clientIdentity.getMSPID.mockImplementationOnce(() => 'Org2MSP');
    return permissionCheck(ctx as any).then(assertions =>
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
  });

  // policy found,
  it('Example 2a: should updateUsername', async () => {});

  // it ('Example 2: should fail to createDocument, with version > 0', async () => {
  //
  // });
});
