import { Redis } from 'ioredis';
import trimStart from 'lodash/trimStart';
import { Commit } from '../../types';

export const commitIndex = [
  'cidx',
  'SCHEMA',
  'entityName',
  'TEXT',
  'WEIGHT',
  5.0,
  'SORTABLE',
  'key',
  'TEXT',
  'SORTABLE',
  'id',
  'TEXT',
  'SORTABLE',
  'event',
  'TAG',
  'ts',
  'NUMERIC',
  'SORTABLE',
];

export const createCommitIndex: (option: {
  documentId: string;
  redisKey: string;
  entityId: string;
  entityName: string;
  event: string;
  ts: number;
}) => any[] = ({ documentId, redisKey, entityName, entityId, event, ts }) => [
  'cidx',
  documentId,
  1.0,
  'REPLACE',
  'FIELDS',
  'key',
  redisKey,
  'entityName',
  entityName,
  'id',
  entityId,
  'event',
  event,
  'ts',
  ts,
];

export const fullTextSearchAddCommit = async (redisKey: string, commit: Commit, redis: Redis) => {
  const { entityId, entityName } = commit;
  const evt = commit.events.reduce<string>((prev, { type }) => `${prev},${type}`, '');

  return redis.send_command(
    'FT.ADD',
    createCommitIndex({
      documentId: `cidx::${redisKey}`,
      redisKey,
      entityName,
      entityId,
      event: trimStart(evt, ','),
      ts: commit.events[0]?.payload?.ts || 0,
    })
  );
};
