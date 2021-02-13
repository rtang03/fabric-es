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
    | 'creator'
    | 'ts'
    | 'evstr']: string;
};
