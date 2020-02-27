import { CONTEXT as CTX, NAMESPACE as NS, Policy, RESOURCE as RES } from '../../types';
import { createId } from '../../utils';

const policies: Policy[] = [
  {
    // Example 1: Only authorized id can create
    // key: `"x509::/O=Dev/OU=client/CN=Admin@example.com::/O=Dev/OU=Dev/CN=rca""allowCreateDocument"`,
    key: `"${createId(['Org1MSP', 'Admin@example.com'])}""allowCreateDocument"`,
    policyClass: 'event-creation',
    sid: 'allowCreateDocument',
    allowedEvents: ['DocumentCreated'],
    attributes: {
      uri: `${NS.MODEL}/${NS.ORG}?id=resourceAttrs:${RES.CREATOR_MSPID}/${NS.ENTITY}?id=resourceAttrs:${RES.ENTITYNAME}`
    },
    condition: {
      hasList: { createDocument: RES.CREATOR_ID }
    },
    effect: 'Allow'
  },
  {
    // Example 2: Only creator can update
    key: `"${createId(['Org1MSP', 'Admin@example.com'])}""allowUpdateUsername"`,
    policyClass: 'event-creation',
    sid: 'allowUpdateUsername',
    allowedEvents: ['UsernameUpdated', 'UserTypeUpdated'],
    attributes: {
      uri: `${NS.MODEL}/${NS.ORG}?id=resourceAttrs:${RES.CREATOR_MSPID}/${NS.ENTITY}?id=resourceAttrs:${RES.ENTITYNAME}/${NS.ENTITYID}?id=resourceAttrs:${RES.ENTITYID}`
    },
    condition: {
      hasList: { updateUsername: CTX.INVOKER_ID },
      stringEquals: {
        [CTX.INVOKER_ID]: RES.CREATOR_ID
      }
    },
    effect: 'Allow'
  },
  {
    // Example 3: Only same mspid can update
    key: `"${createId(['Org1MSP', 'Admin@example.com'])}""allowUpdateTitle"`,
    policyClass: 'event-creation',
    sid: 'allowUpdateTitle',
    allowedEvents: ['TitleUpdated', 'Title2Updated'],
    attributes: {
      uri: `${NS.MODEL}/${NS.ORG}?id=resourceAttrs:${RES.CREATOR_MSPID}/${NS.ENTITY}?id=resourceAttrs:${RES.ENTITYNAME}/${NS.ENTITYID}?id=resourceAttrs:${RES.ENTITYID}`
    },
    condition: {
      hasList: { updateTitle: CTX.INVOKER_ID },
      stringEquals: {
        [CTX.INVOKER_MSPID]: RES.CREATOR_MSPID
      }
    },
    effect: 'Allow'
  },
  {
    key: `"${createId(['Org1MSP', 'Admin@example.com'])}""allowCreateTrade"`,
    policyClass: 'event-creation',
    sid: 'allowCreateTrade',
    allowedEvents: ['TradeCreated'],
    attributes: {
      uri: `${NS.MODEL}/${NS.ORG}?id=resourceAttrs:${RES.CREATOR_MSPID}/${NS.ENTITY}?id=resourceAttrs:${RES.ENTITYNAME}`
    },
    condition: {
      hasList: { createTrade: RES.CREATOR_ID }
    },
    effect: 'Allow'
  }
];

const TEST_ID = `"${createId(['Org1MSP', 'Admin@example.com'])}"`;
const TEST_POLICY = `"${createId(['Org1MSP', 'Admin@example.com'])}""allowCreateDocument"`;
const TEST_POLICY2 = `"${createId(['Org1MSP', 'Admin@example.com'])}""allowCreateTrade"`;

export const policyDb = {
  [TEST_ID]: Promise.resolve(policies),
  [TEST_POLICY]: Promise.resolve(policies.filter(({ sid }) => sid === 'allowCreateDocument').pop()),
  [TEST_POLICY2]: Promise.resolve(policies.filter(({ sid }) => sid === 'allowCreateTrade').pop()),
  '"wrong id + valid policy"': Promise.resolve(policies)
};
