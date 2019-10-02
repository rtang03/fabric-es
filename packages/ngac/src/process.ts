// import { filter, includes, keys } from 'lodash';
// import { Policy } from './policy';
// import { Principal, Resource } from './types';
//
// type Effect = 'Allow' | 'Deny';
//
// export const processRequest = ({
//   resources,
//   policies,
//   principal
// }: {
//   policies: Policy[];
//   resources?: Resource[];
//   principal?: Principal;
// }) => ({
//   request: ({
//     action,
//     resource
//   }: {
//     action: string;
//     resource: Resource;
//   }): Promise<Effect> => {
//     const access = filter(policies, policy => includes(policy.action, action))
//       .map(({ resourceAttr }) =>
//         keys(resourceAttr).reduce(
//           (prev, curr) => prev && resourceAttr[curr] === resource[curr],
//           true
//         )
//       )
//       .reduce((prev, curr) => prev && curr, true);
//     return access ? Promise.resolve('Allow') : Promise.resolve('Deny');
//   }
// });
