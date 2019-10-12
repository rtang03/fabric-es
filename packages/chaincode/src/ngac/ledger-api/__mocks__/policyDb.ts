import {
  CONTEXT as CTX,
  NAMESPACE as NS,
  Policy,
  RESOURCE as RES
} from '../../types';

export const policyDb: () => Policy[] = () => [
  {
    // Example 1: Only authorized id can create
    key: '',
    policyClass: 'event-creation',
    sid: 'allowCreateDocument',
    allowedEvents: ['DocumentCreated'],
    attributes: {
      uri: `${NS.MODEL}/${NS.ORG}?id=resourceAttrs:${RES.CREATOR_MSPID}/${NS.ENTITY}?id=resourceAttrs:${RES.ENTITYNAME}`
    },
    condition: {
      hasList: { createDocument: `${RES.CREATOR_ID}` }
    },
    effect: 'Allow'
  },
  {
    // Example 2: Only creator can update
    key: '',
    policyClass: 'event-creation',
    sid: 'allowUpdateUsername',
    allowedEvents: ['UsernameUpdated', 'UserTypeUpdated'],
    attributes: {
      uri: `${NS.MODEL}/${NS.ORG}?id=resourceAttrs:${RES.CREATOR_MSPID}/${NS.ENTITY}?id=resourceAttrs:${RES.ENTITYNAME}/${NS.ENTITYID}?id=resourceAttrs:${RES.ENTITYID}`
    },
    condition: {
      hasList: { updateUsername: `${CTX.INVOKER_ID}` },
      stringEquals: {
        [CTX.INVOKER_ID]: `${RES.CREATOR_ID}`
      }
    },
    effect: 'Allow'
  },
  {
    // Example 3: Only same mspid can update
    key: '',
    policyClass: 'event-creation',
    sid: 'allowUpdateTitle',
    allowedEvents: ['TitleUpdated', 'Title2Updated'],
    attributes: {
      uri: `${NS.MODEL}/${NS.ORG}?id=resourceAttrs:${RES.CREATOR_MSPID}/${NS.ENTITY}?id=resourceAttrs:${RES.ENTITYNAME}/${NS.ENTITYID}?id=resourceAttrs:${RES.ENTITYID}`
    },
    condition: {
      hasList: { updateTitle: `${CTX.INVOKER_ID}` },
      stringEquals: {
        [CTX.INVOKER_MSPID]: `${RES.CREATOR_MSPID}`
      }
    },
    effect: 'Allow'
  }
];
