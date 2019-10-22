import { ngacRepo } from '../ngacRepo';
import { permissionCheck } from '../permissionCheck';
import { CONTEXT, NAMESPACE as NS, RESOURCE, RESOURCE as RES } from '../types';
import { createPolicy, createResource } from '../utils';
import { createMSPResource } from '../utils/createMSPResource';
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
context.clientIdentity.getMSPID.mockImplementation(() => 'Org3MSP');
context.clientIdentity.getX509Certificate.mockImplementation(() => ({
  subject: { commonName: 'Admin@org3.example.com' },
  issuer: { commonName: 'rca-org3' }
}));

describe('Example 1: PolicyEngine/CRUD Tests', () => {
  beforeEach(() => {
    entityName = 'dev_subject';
    entityId = 'subject_01';
    version = '0';
    id = 'x509::/O=Dev/OU=client/CN=Tester01@example.com';
    context.clientIdentity.getID.mockImplementation(() => id);
  });

  it('should create Org3MSP attribute', async () => {
    const mspId = 'Org3MSP';
    const mspAttrs = [
      { type: '1', key: 'mspid', value: 'Org3MSP' },
      { type: '1', key: 'env', value: 'test' }
    ];
    const mspResource = createMSPResource({ context, mspId, mspAttrs });
    await ngacRepo(context)
      .addMSPAttr(mspResource)
      .then(attrs => expect(attrs).toEqual(mspAttrs));
  });

  it('should create entityName attribute', async () => {
    const resourceAttrs = [
      { type: '1', key: 'entityNameOwner', value: 'tester' },
      {
        type: '1',
        key: 'createSubject',
        value: ['x509::/O=Dev/OU=client/CN=Tester01@example.com']
      }
    ];
    await ngacRepo(context)
      .addResourceAttr(
        createResource({
          context,
          entityName,
          resourceAttrs
        })
      )
      .then(attrs => expect(attrs).toEqual(resourceAttrs));
  });

  it('should create policy', async () => {
    const policy = createPolicy({
      context,
      policyClass: 'consolidated-test',
      sid: 'allowCreateSubject',
      allowedEvents: ['SubjectCreated'],
      uri: `${NS.MODEL}/${NS.ORG}?id=resourceAttrs:${RES.CREATOR_MSPID}/${NS.ENTITY}?id=resourceAttrs:${RES.ENTITYNAME}`,
      condition: {
        hasList: { createSubject: `${RES.CREATOR_ID}` }
      },
      effect: 'Allow'
    });

    await ngacRepo(context)
      .addPolicy(policy)
      .then(policy => expect(policy).toMatchSnapshot());
  });

  it('should createSubject', async () => {
    eventStr = JSON.stringify([{ type: 'SubjectCreated' }]);
    context.stub.getFunctionAndParameters.mockImplementation(() => ({
      fcn: 'createCommit',
      params: [entityName, entityId, version, eventStr]
    }));

    return permissionCheck({ context }).then(assertions =>
      expect(assertions).toEqual([
        { sid: 'allowCreateSubject', assertion: true }
      ])
    );
  });

  it('should fail createNothing', async () => {
    eventStr = JSON.stringify([{ type: 'NothingCreated' }]);
    context.stub.getFunctionAndParameters.mockImplementation(() => ({
      fcn: 'createCommit',
      params: [entityName, entityId, version, eventStr]
    }));
    return permissionCheck({ context }).then(assertions =>
      expect(assertions).toEqual([
        { sid: 'system', assertion: false, message: 'No policy found' }
      ])
    );
  });

  it('should create policy #2 with both hasList and strictEquals', async () => {
    const policy = createPolicy({
      context,
      policyClass: 'consolidated-test',
      sid: 'allowUpdateSubject',
      allowedEvents: ['SubjectUpdated'],
      uri: `${NS.MODEL}/${NS.ORG}?id=resourceAttrs:${RES.CREATOR_MSPID}/${NS.ENTITY}?id=resourceAttrs:${RES.ENTITYNAME}/${NS.ENTITYID}?id=resourceAttrs:${RES.ENTITYID}`,
      condition: {
        hasList: { updateSubject: `${RES.CREATOR_ID}` },
        stringEquals: { [CONTEXT.INVOKER_MSPID]: RESOURCE.CREATOR_MSPID }
      },
      effect: 'Allow'
    });

    await ngacRepo(context)
      .addPolicy(policy)
      .then(({ sid }) => expect(sid).toEqual(policy.sid));
  });

  it('should add resourceAttribute of updateSubject', async () => {
    const resourceAttrs = [
      {
        type: '1',
        key: 'updateSubject',
        value: ['x509::/O=Dev/OU=client/CN=Tester01@example.com']
      }
    ];
    await ngacRepo(context)
      .upsertResourceAttr(
        createResource({
          context,
          entityName,
          entityId,
          resourceAttrs
        })
      )
      .then(attributes =>
        attributes.filter(({ key }) => key === 'updateSubject')
      )
      .then(attribute =>
        expect(attribute).toEqual([
          {
            type: '1',
            key: 'updateSubject',
            value: ['x509::/O=Dev/OU=client/CN=Tester01@example.com']
          }
        ])
      );
  });

  it('should updateSubject', async () => {
    version = '1';
    eventStr = JSON.stringify([{ type: 'SubjectUpdated' }]);
    context.stub.getFunctionAndParameters.mockImplementation(() => ({
      fcn: 'createCommit',
      params: [entityName, entityId, version, eventStr]
    }));

    return permissionCheck({ context }).then(assertions =>
      expect(assertions).toEqual([
        { sid: 'allowUpdateSubject', assertion: true }
      ])
    );
  });
});
