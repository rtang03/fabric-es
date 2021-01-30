import { Commit } from '../../types';
import { RedisearchMapField } from './redisearchMapField';

/**
 * @about common field of commit; originated from [[Commit]]
 */
export type CommonCommitFields = Pick<
  Commit,
  'id' | 'commitId' | 'entityName' | 'mspId' | 'version' | 'events'
>;

/**
 * @about derived / new fields introducted, right BEFORE writing to Redis. The dervied fields is
 * useful to better search capability, during full-text-search. It may uplift the deeply nested
 * field values, such "creator", to flatten Redis K/V structure.
 */
export type DerivedCommitFields = {
  creator: string;
  evstr: string;
  event: string;
  ts: number;
};

/**
 * @about consolidated fields defintion of commit in Redis. It defines all [[FieldOption]] of
 * [[Commit]]
 */
export type CommitMapFields = RedisearchMapField<CommonCommitFields & DerivedCommitFields>;
