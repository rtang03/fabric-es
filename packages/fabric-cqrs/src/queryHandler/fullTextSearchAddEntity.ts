import type { Redis } from 'ioredis';
import uniq from 'lodash/uniq';

/**
 * 📌 IMPORTANT: It defines the indexed field of entity
 */
export const entityIndex = [
  'eidx',
  'SCHEMA',
  'key',
  'TEXT',
  'SORTABLE',
  'type',
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
  'org',
  'TAG',
];

/**
 * Create index *eidx*
 * @param documentId
 * @param redisKey
 * @param entityName
 * @param id
 * @param creator
 * @param created
 * @param ts
 * @param desc
 * @param tag
 * @param event
 * @param org
 */
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
  org: string;
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
  org,
}) => {
  const result = [
    'eidx',
    documentId,
    1.0,
    'REPLACE',
    'FIELDS',
    'key',
    redisKey,
    'type',
    entityName,
    'id',
    id,
    'creator',
    creator,
    'event',
    event,
  ];

  desc && result.push('desc');
  desc && result.push(desc);
  tag && result.push('tag');
  tag && result.push(tag);
  created && result.push('created');
  created && result.push(created);
  ts && result.push('ts');
  ts && result.push(ts);
  org && result.push('org');
  org && result.push(org);

  return result;
};

/**
 * Add new entity to *eidx*
 * @param redisKey
 * @param entity
 * @param redis
 */
export const fullTextSearchAddEntity = async <
  TEntity extends {
    id?: string;
    _creator?: string;
    _created?: number;
    _ts?: number;
    _event?: string;
    _organization?: string[];
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
  const org = entity._organization.reduce((prev, curr) => (prev ? `${prev},${curr}` : curr), null);

  const indexed = createEntityIndex({
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
    org,
  });

  return redis.send_command('FT.ADD', indexed);
};
