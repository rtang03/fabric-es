/**
 * @about Commit physically in redis. Notice that [[FieldOption]].altName may rename field when
 * writing to Redis. Hence key names of CommitInRedis may be different from key names
 * of [[RedisCommitFields]].
 */
export type CommitInRedis = {
  [K in
    | 'id'
    | 'entityName'
    | 'v'
    | 'commitId'
    | 'entityId'
    | 'mspId'
    | 'event'
    | 'events'
    | 'creator'
    | 'ts'
    | 'evstr']: string;
};

/**
 * @about re-selector processes the Commit after reading from Redis. It renders the query result
 * and, restore back to [[Commit]]; but appended with dervied field.
 */
export type ReselectedCommitAfterRedis = {
  id: string;
  entityId: string;
  commitId?: string;
  entityName: string;
  ts: number;
  version: number;
  events: Record<string, unknown>[];
  event: string;
  mspId: string;
};
