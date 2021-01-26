import { FTSchemaField } from 'redis-modules-sdk';

export type EntityDefaultSchema = {
  [K in
    | 'created'
    | 'creator'
    | 'desc'
    | 'event'
    | 'id'
    | 'org'
    | 'tag'
    | 'type'
    | 'ts']: FTSchemaField;
};
