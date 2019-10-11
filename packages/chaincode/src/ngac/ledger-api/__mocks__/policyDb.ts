import {
  CONTEXT as CTX,
  NAMESPACE as NS,
  Policy,
  RESOURCE as RES
} from '../../types';

export const policyDb: () => Policy[] = () => [
  {
    // Example 1
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
    // Example 2
    policyClass: 'event-creation',
    sid: 'allowUpdateUsername',
    allowedEvents: ['UsernameUpdated', 'UserTypeUpdated'],
    attributes: {
      uri: `${NS.MODEL}/${NS.ORG}?id=resourceAttrs:${RES.CREATOR_MSPID}/${NS.ENTITY}?id=resourceAttrs:${RES.ENTITYNAME}/${NS.ENTITYID}?id=resourceAttrs:${RES.ENTITYID}`
    },
    condition: {
      hasList: { updateUsername: `${CTX.INVOKER_ID}` },
      stringEquals: {
        [CTX.INVOKER_MSPID]: `${RES.CREATOR_MSPID}`
      }
    },
    effect: 'Allow'
  }
  // {
  //   policyClass: 'administrativeRights',
  //   sid: 'allowCreateUser',
  //   action: ['createuser', 'updateuser'],
  //   attributes: {
  //     creatorCN: '${PrincipalTag/cn}',
  //     creatorID: '${PrincipalTag/id}',
  //     creatorMSPID: '',
  //     invokerID: '',
  //     invokerMSPID: '${PrincipalTag/mspid}',
  //     entityName: 'dev',
  //     invokerSubjectCN: '',
  //     invokerIssuerCN: '',
  //     version: '',
  //     resourceType: 'iam'
  //   },
  //   condition: {
  //     stringEquals: { userName: '${accountName}' },
  //     boolIfExists: { accountPresent: 'false' },
  //     dataGreaterThan: { currenTime: '2019' },
  //     stringLike: {
  //       'orgName:IdentityTag/admin': '${entityType:ResourceTag/canApprove}'
  //     }
  //   },
  //   effect: 'Allow'
  // },
];
