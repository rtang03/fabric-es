import { Redisearch } from 'redis-modules-sdk';

/**
 * Batch execution of redis command
 * @ignore
 */
export const pipelineExec: <TResult = any>(
  client: Redisearch,
  action: 'GET_ALL',
  pattern: string
) => Promise<[Error, TResult][]> = async (client, action, pattern) => {
  const keys = await client.redis.keys(pattern);
  // const sortedKeys = keys.sort();
  // const filteredKeysOfEntity = keys.filter((key) => key.split('::').length === 2);
  // const pipeline = redis.pipeline();
  // if (action === 'GET') sortedKeys.forEach((key) => pipeline.get(key));
  // if (action === 'DEL') keys.forEach((key) => pipeline.del(key));
  // if (action === 'GET_ENTITY_ONLY') filteredKeysOfEntity.forEach((key) => pipeline.get(key));

  const pipeline = client.redis.pipeline();

  ({
    GET_ALL: () => keys.sort().forEach((key) => pipeline.hgetall(key)),
  }[action]());

  return pipeline.exec();
};
