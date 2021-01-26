import { FTSchemaField } from 'redis-modules-sdk';

/**
 * the fields to be indexed. Make it intuitive / human readable, because
 * its field name will be used in the web ui's search box.
 */
export type CommitDefaultSchema = {
  [K in 'creator' | 'event' | 'id' | 'msp' | 'type' | 'ts']: FTSchemaField;
};
