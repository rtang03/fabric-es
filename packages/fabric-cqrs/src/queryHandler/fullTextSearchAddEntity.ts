import type { Redis } from 'ioredis';
import uniq from 'lodash/uniq';

export const entityIndex = [
  'eidx',
  'SCHEMA',
  'key',
  'TEXT',
  'SORTABLE',
  'entname',
  'TEXT',
  'id',
  'TEXT',
  'SORTABLE',
  'creator',
  'TEXT',
  'event',
  'TAG',
  'desc',
  'TEXT',
  'tag',
  'TAG',
  'created',
  'NUMERIC',
  'SORTABLE',
  'ts',
  'NUMERIC',
  'SORTABLE',
];

export const createEntityIndex: (option: {
  documentId: string;
  entityName: string;
  redisKey: string;
  id: string;
  creator: string;
  created?: number;
  ts?: number;
  desc?: string;
  tag?: string;
  event: string;
}) => any[] = ({
  documentId,
  redisKey,
  entityName,
  id,
  creator,
  created,
  ts,
  desc,
  tag,
  event,
}) => {
  const result = [
    'eidx',
    documentId,
    1.0,
    'REPLACE',
    'FIELDS',
    'key',
    redisKey,
    'entname',
    entityName,
    'id',
    id,
    'creator',
    creator,
    'event',
    event,
  ];

  created && result.push('created');
  created && result.push(created);
  ts && result.push('ts');
  ts && result.push(ts);
  desc && result.push('desc');
  desc && result.push(desc);
  tag && result.push('tag');
  tag && result.push(tag);

  return result;
};

export const fullTextSearchAddEntity = async <
  TEntity extends {
    id?: string;
    _creator?: string;
    _created?: number;
    _ts?: number;
    _event?: string;
    desc?: string;
    tag?: string;
  }
>(
  redisKey: string,
  entity: TEntity,
  redis: Redis
) => {
  const uniqueEvents = uniq(entity._event.split(',')).reduce(
    (prev, curr) => (prev ? `${prev},${curr}` : curr),
    null
  );

  const index = createEntityIndex({
    documentId: `eidx::${redisKey}`,
    entityName: redisKey.split('::')[0],
    redisKey,
    id: entity.id,
    creator: entity?._creator,
    created: entity?._created,
    ts: entity?._ts,
    desc: entity?.desc,
    tag: entity?.tag,
    event: uniqueEvents,
  });
  return redis.send_command('FT.ADD', index);
};
