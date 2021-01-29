import { Commit } from '../../types';
import { MapField } from './mapField';

/**
 * @about derived new field
 */
export type DerivedCommit = {
  creator: string;
  evstr: string;
  event: string;
  ts: number;
};

/**
 * @about selected field of commit
 */
export type CommonCommit = Pick<
  Commit,
  'id' | 'commitId' | 'entityName' | 'mspId' | 'version' | 'events'
>;

/**
 * @about type defintion of commit in Redis
 */
export type RedisCommit = MapField<CommonCommit & DerivedCommit>;
