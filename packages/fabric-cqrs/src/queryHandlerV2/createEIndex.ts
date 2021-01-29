// import flatten from 'lodash/flatten';
// import uniq from 'lodash/uniq';
// import values from 'lodash/values';
// import { Redisearch, FTSchemaField, FTCreateParameters } from 'redis-modules-sdk';
// import type { BaseMetaEntity } from '../types';
// import type { EntityDefaultSchema } from './__utils__';
//
// export const TEST_ENTITYNAME = 'test_proj';
// export const getEidxName = (entityName: string) => `eidx:${entityName}`;
// export const getEidxPrefix = (entityName: string) => `e:${entityName}:`;
//
// export const getEntityHashFields: <TEntity>(entity) => (string | number)[] = <
//   TEntity extends BaseMetaEntity
// >(
//   entity
// ) => {
//
//   return flatten(
//     Object.entries<TEntity>(entity).map(([key, value]) => [
//       key,
//       {
//         id: ({ id }: TEntity) => id,
//         creator: ({ _creator }: TEntity) => _creator,
//         created: ({ _created }: TEntity) => _created,
//         ts: ({ _ts }: TEntity) => _ts,
//         desc: ({ desc }: TEntity) => desc,
//         tag: ({ tag }: TEntity) => tag,
//         event: ({ _event }: TEntity) => {
//           return uniq(_event.split(',')).reduce(
//             (prev, curr) => (prev ? `${prev},${curr}` : curr),
//             null
//           );
//         },
//         org: ({ _organization }: TEntity) => {
//           return _organization.reduce((prev, curr) => (prev ? `${prev},${curr}` : curr), null);
//         },
//       }[key](value),
//     ])
//   );
// };
//
// /**
//  * @about default schema is used for secondary indexing
//  */
// const defaultSchema: EntityDefaultSchema = {
//   // field 1: creation timestamp
//   created: { name: 'created', type: 'NUMERIC', sortable: true },
//   // field 2: creator
//   creator: { name: 'creator', type: 'TEXT' },
//   // field 3: description
//   desc: { name: 'desc', type: 'TEXT' },
//   // field 4: stringify list of event involved
//   event: { name: 'event', type: 'TAG' },
//   // field 5: the same as entityId
//   id: { name: 'id', type: 'TEXT', sortable: true },
//   // field 6: stringify list of organization names
//   org: { name: 'org', type: 'TAG' },
//   // field 7: tag
//   tag: { name: 'tag', type: 'TAG' },
//   // field 8: the same as entityName. "type" is more user friendly for rendering to UI
//   type: { name: 'type', type: 'TEXT' },
//   // field 9: last modified timestamp
//   ts: { name: 'ts', type: 'NUMERIC', sortable: true },
// };
//
// const defaultParam: FTCreateParameters = {
//   prefix: [{ count: 1, name: `e:${TEST_ENTITYNAME}:` }],
// };
//
// export const createEIndex: (
//   client: Redisearch,
//   option: {
//     schema?: FTSchemaField[];
//     param: FTCreateParameters & Required<Pick<FTCreateParameters, 'prefix'>>;
//   }
// ) => Promise<'OK'> = async (client, { schema = [], param = defaultParam }) =>
//   client.create(
//     getEidxName(TEST_ENTITYNAME),
//     // defaultSchema is priority
//     [...schema, ...values<FTSchemaField>(defaultSchema)],
//     // input 'param' is priority
//     Object.assign({}, defaultParam, param)
//   );
