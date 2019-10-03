import {
  CAN_CREATE_USER_ENTITY,
  CAN_UPDATE_USER_ENTITY,
  Context,
  Policy
} from './types';

export const policies: (context: Context) => Policy[] = ({
  orgName,
  userId
}) => [
  {
    policyClass: 'administrativeRights',
    sid: 'allowCreateUser',
    action: [CAN_CREATE_USER_ENTITY, CAN_UPDATE_USER_ENTITY],
    resourceAttr: {
      orgName,
      userId
    },
    // condition: {
    //   stringEquals: { userName: '${accountName}' },
    //   boolIfExists: { accountPresent: 'false' },
    //   dataGreaterThan: { currenTime: '2019' },
    //   stringLike: {
    //     'orgName:IdentityTag/admin': '${entityType:ResourceTag/canApprove}'
    //   }
    // },
    effect: 'Allow'
  },
  {
    policyClass: 'administrativeRights',
    sid: 'allowTagResource',
    action: [CAN_UPDATE_USER_ENTITY],
    resourceAttr: {
      orgName,
      userId
    },
    effect: 'Allow'
  }
];
