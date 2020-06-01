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
  'SORTABLE'
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
  ts
];
