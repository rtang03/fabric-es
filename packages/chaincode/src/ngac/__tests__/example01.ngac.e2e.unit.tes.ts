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

describe('Example 1: Consolidated Tests', () => {
  beforeEach(() => {
    entityName = 'dev_ngac_example3';
    entityId = 'ngac_unit_03';
    version = '1';
    eventStr = JSON.stringify([{ type: 'TitleUpdated' }]);
    id = 'x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca';
    context.stub.getFunctionAndParameters.mockImplementation(() => ({
      fcn: 'createCommit',
      params: [entityName, entityId, version, eventStr]
    }));
    context.clientIdentity.getID.mockImplementation(() => id);
  });

  // policy found, createCommit for pre-existing entity.
  // it('3a: should updateTitle', async () =>
  //   await permissionCheck({ context }).then(assertions =>
  //     expect(assertions).toEqual([{ sid: 'allowUpdateTitle', assertion: true }])
  //   ));

  it('3b: should fail updateUsername with valid & unauthorized MSPID', async () => {
    context.clientIdentity.getMSPID.mockImplementation(() => 'Org2MSP');
    return permissionCheck({ context }).then(assertions =>
      expect(assertions).toEqual([
        { sid: 'allowUpdateTitle', assertion: false }
      ])
    );
  });

  // it('2c: should fail updateUsername with wrong ID, , when his policy not exists', async () => {
  //   context.clientIdentity.getID.mockImplementationOnce(
  //     () => 'wrong id; without valid policy'
  //   );
  //   return permissionCheck({ context }).then(assertions =>
  //     expect(assertions).toEqual([
  //       { sid: 'system', assertion: false, message: 'No policy found' }
  //     ])
  //   );
  // });

  // it('2d: should fail updateUsername with non-existing mspid', async () => {
  //   context.clientIdentity.getMSPID.mockImplementation(() => 'wrong-mspid');
  //   return permissionCheck({ context }).then(assertions =>
  //     expect(assertions).toEqual([
  //       {
  //         sid: 'allowUpdateUsername',
  //         assertion: false,
  //         message: `Resource URI fail to parse`
  //       }
  //     ])
  //   );
  // });
});
