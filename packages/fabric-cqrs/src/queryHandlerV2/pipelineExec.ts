import { Redisearch } from 'redis-modules-sdk';

/**
 * Batch execution of redis command
 * @ignore
 */
export const pipelineExec: <TResult = any>(
  client: Redisearch,
  action: 'GET_ALL' | 'DELETE',
  pattern: string,
  keys?: string[]
) => Promise<[Error, TResult][]> = async (client, action, pattern, keys) => {
  const _keys = keys || (await client.redis.keys(pattern));

  if (!_keys) throw new Error('keys not found');

  const pipeline = client.redis.pipeline();

  ({
    GET_ALL: () => _keys.sort().forEach((key) => pipeline.hgetall(key)),
    DELETE: () => _keys.forEach((key) => pipeline.del(key)),
  }[action]());

  return pipeline.exec();
};
