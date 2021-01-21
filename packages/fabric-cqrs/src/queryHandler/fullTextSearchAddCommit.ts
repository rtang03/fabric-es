import type { Redis } from 'ioredis';
import trimStart from 'lodash/trimStart';
import type { Commit } from '../types';

/**
 * @about define the indexed field of commit
 */
export const commitIndex = [
  'cidx',
  'SCHEMA',
  'type',
  'TEXT',
  'WEIGHT',
  2.0,
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
  'msp',
  'TAG',
  'creator',
  'TEXT',
  'SORTABLE',
];

/**
 * @about create index *cidx*
 * @params option
 */
export const createCommitIndex: (option: {
  documentId: string;
  redisKey: string;
  entityId: string;
  entityName: string;
  event: string;
  ts: number;
  creator: string;
  msp: string;
}) => any[] = ({ documentId, redisKey, entityName, entityId, event, ts, creator, msp }) => {
  const baseIndex = [
    'cidx',
    documentId,
    1.0,
    'REPLACE',
    'FIELDS',
    'key',
    redisKey,
    'type',
    entityName,
    'id',
    entityId,
    'event',
    event,
    'ts',
    ts,
    'msp',
    msp,
  ];

  return creator ? [...baseIndex, 'creator', creator] : baseIndex;
};

/**
 * @about add new entity to *cidx*
 * @params redisKey
 * @params commit
 * @params redis
 */
export const fullTextSearchAddCommit = async (redisKey: string, commit: Commit, redis: Redis) => {
  const { entityId, entityName } = commit;
  const evt = commit.events.reduce<string>((prev, { type }) => `${prev},${type}`, '');

  const indexed = createCommitIndex({
    documentId: `cidx::${redisKey}`,
    redisKey,
    entityName,
    entityId,
    event: trimStart(evt, ','),
    ts: commit.events[0]?.payload?._ts || 0,
    creator: commit.events[0]?.payload?._creator,
    msp: commit.mspId,
  });

  return redis.send_command('FT.ADD', indexed);
};
