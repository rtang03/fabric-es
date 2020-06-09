import type { Redis } from 'ioredis';

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
  'desc',
  'TEXT',
  'tag',
  'TAG',
];

export const createEntityIndex: (option: {
  documentId: string;
  entityName: string;
  redisKey: string;
  id: string;
  desc?: string;
  tag?: string;
}) => any[] = ({ documentId, redisKey, entityName, id, desc, tag }) => {
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
  ];

  if (desc) {
    result.push('desc');
    result.push(desc);
  }

  if (tag) {
    result.push('tag');
    result.push(tag);
  }

  return result;
};

export const fullTextSearchAddEntity = async <
  TEntity extends { id?: string; desc?: string; tag?: string }
>(
  redisKey: string,
  entity: TEntity,
  redis: Redis
) => {
  const index = createEntityIndex({
    documentId: `eidx::${redisKey}`,
    entityName: redisKey.split('::')[0],
    redisKey,
    id: entity.id,
    desc: entity?.desc,
    tag: entity?.tag,
  });
  return redis.send_command('FT.ADD', index);
};
