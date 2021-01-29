import { FTSchemaField } from 'redis-modules-sdk';

/**
 * @about define field of Redis Hash
 */
export type FieldOption<TEntity = any> = {
  /* rename the key of hash field */
  altName?: string;
  /* secondary index schema */
  index?: Omit<FTSchemaField, 'name'>;
  /* field transformation */
  transform?: (arg: TEntity) => string | number;
};

/**
 * @about Map of FieldOptions for each Hash field
 */
export type MapField<T> = {
  [K in keyof T as `${Lowercase<string & K>}`]: FieldOption<T>;
};
