import { Redisearch } from 'redis-modules-sdk';

/**
 * Batch execution of redis command
 * @ignore
 */
export const pipelineExec: <TResult = any>(
  client: Redisearch,
  action: 'HGETALL' | 'DELETE' | 'GET',
  pattern: string,
  keys?: string[]
) => Promise<[Error, TResult][]> = async (client, action, pattern, keys) => {
  // scan return [string, string[]] , i.e. [cursor, keys[]]
  // TODO: Need double check what is right number of COUNT
  const _keys = keys || (await client.redis.scan(0, 'MATCH', pattern, 'COUNT', 1000))[1];

  if (!_keys) throw new Error('keys not found');

  const pipeline = client.redis.pipeline();

  ({
    DELETE: () => _keys.forEach((key) => pipeline.del(key)),
    HGETALL: () => _keys.forEach((key) => pipeline.hgetall(key)),
    GET: () => _keys.forEach((key) => pipeline.get(key)),
  }[action]());

  return pipeline.exec();
};
