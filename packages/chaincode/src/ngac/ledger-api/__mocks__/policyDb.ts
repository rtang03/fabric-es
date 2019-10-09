import { NAMESPACE, Policy, RESOURCE } from '../../types';

export const policyDb: () => Policy[] = () => [
  {
    // Example 1
    policyClass: 'event-creation',
    sid: 'allowCreateDocument',
    allowedEvents: ['DocumentCreated'],
    attributes: {
      uri: `${NAMESPACE.MODEL}/${NAMESPACE.ORG}?id=resourceAttrs:${RESOURCE.CREATOR_MSPID}/${NAMESPACE.ENTITY}?id=resourceAttrs:${RESOURCE.ENTITYNAME}`
    },
    condition: {
      can: { createDocument: `${RESOURCE.CREATOR_ID}` }
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
