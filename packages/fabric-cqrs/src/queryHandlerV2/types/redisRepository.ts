export type RedisRepository<TResult = any> = {
  // https://oss.redislabs.com/redisearch/Commands/#ftcreate
  createIndex: () => Promise<'OK'>;
  dropIndex: (deleteHash?: boolean) => Promise<'OK'>;
  // see https://redis.io/commands/hmset
  // see https://oss.redislabs.com/redisearch/Commands/#hsethsetnxhdelhincrbyhdecrby
  hmset: (item: any) => Promise<'OK'>;
  // see https://redis.io/commands/hgetall
  hgetall: (key: string) => Promise<TResult>;
  getKey: (item: any) => string;
  getIndexName: () => string;
  convert: (item: any) => (string | number)[];
};
