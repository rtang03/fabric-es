// import { pubSub } from 'fabric-rx-cqrs';
// import { withFilter } from 'graphql-subscriptions';
// import { intersection, map } from 'lodash';
//
// export const subscribeByEntityName = (entityName: string) =>
//   withFilter(
//     () => pubSub.asyncIterator('ENTITY'),
//     (
//       payload: { events: any[] },
//       variables: { entityName: string; events: string[] }
//     ): boolean =>
//       variables.entityName === entityName &&
//       !!intersection(map(payload.events, 'type'), variables.events).length
//   );
//
// export const subscribeById = (entityName: string) =>
//   withFilter(
//     () => pubSub.asyncIterator('ENTITY'),
//     (
//       payload: { id: string; events: any[] },
//       variables: { id: string; entityName: string; events: string[] }
//     ): boolean =>
//       variables.entityName === entityName &&
//       !!intersection(map(payload.events, 'type'), variables.events).length &&
//       payload.id === variables.id
//   );
