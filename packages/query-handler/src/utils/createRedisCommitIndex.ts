export const createRedisCommitIndex: (option: {
  documentId: string;
  redisKey: string;
  entityId: string;
  entityName: string;
  event: string;
  timestamp: string;
}) => any[] = ({ documentId, redisKey, entityName, entityId, event, timestamp }) => [
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
  timestamp
];
