import { Context } from 'fabric-contract-api';
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
const entityName = 'dev_ngac';
const entityId = 'ngac_unit_01';
const version = '0';
const eventStr = JSON.stringify([{ type: 'DocumentCreated' }]);
const id = 'x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca';

ctx.stub.getFunctionAndParameters.mockImplementation(() => ({
  fcn: 'createCommit',
  params: [entityName, entityId, version, eventStr]
}));
ctx.clientIdentity.getMSPID.mockImplementation(() => 'Org1MSP');
ctx.clientIdentity.getX509Certificate.mockImplementation(() => ({
  subject: { commonName: 'Admin@org1.example.com' },
  issuer: { commonName: 'rca-org1' }
}));
ctx.clientIdentity.getID.mockImplementation(() => id);

describe('Permission-check Tests', () => {
  it('should perform permission check', async () =>
    // @ts-ignore
    await permissionCheck(ctx));
});
