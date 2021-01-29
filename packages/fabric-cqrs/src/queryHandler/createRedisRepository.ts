import flatten from 'lodash/flatten';
import { FTCreateParameters, FTSchemaField, Redisearch } from 'redis-modules-sdk';
import { FieldOption, MapField } from './types';

/**
 * @about create abstract layer for redis repository
 */
const createRedisRepository: (option: {
  client: Redisearch;
  kind: 'entity' | 'commit';
  fields: MapField<any>;
  entityName: string;
  param: FTCreateParameters;
}) => { createIndex: any; convert: (entity) => (string | number)[] } = <TEntity>({
  client,
  kind,
  fields,
  entityName,
  param,
}) => {
  // every entity is indexed "e:entityName". commit is "c:"
  const name = { entity: () => `e:${entityName}:`, commit: () => 'c:' }[kind]();

  // convert to Redis Hash fields format
  const convertHashFields: <E>(fields: MapField<E>, item: E) => (string | number)[] = <E>(
    input,
    item
  ) =>
    flatten<string | number>(
      Object.entries<FieldOption<E>>(input).map(([key, { altName, transform }]) => [
        altName ?? key,
        transform(item),
      ])
    );

  // add default FTCreateParameters
  const getParam: (param: FTCreateParameters) => FTCreateParameters = (param) =>
    Object.assign({}, { prefix: [{ count: 1, name }] }, param);

  // compute schema
  const getSchema: <F>(fields: F) => FTSchemaField[] = <F extends FieldOption>(input) =>
    Object.entries<F>(input)
      .map(
        ([key, { altName, index }]) =>
          index && {
            ...index,
            name: altName ?? key,
          }
      )
      .filter((item) => !!item);

  return {
    createIndex: () => client.create(name, getSchema<TEntity>(fields), getParam(param)),
    convert: (entity) => convertHashFields<TEntity>(fields, entity),
  };
};
