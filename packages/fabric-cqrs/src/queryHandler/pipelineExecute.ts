import type { Redis } from 'ioredis';

export const pipelineExecute = async (
  redis: Redis,
  action: 'GET' | 'DEL' | 'GET_ENTITY_ONLY',
  pattern: string
) => {
  const keys = await redis.keys(pattern);
  const sortedKeys = keys.sort();
  const filteredKeysOfEntity = keys.filter((key) => key.split('::').length === 2);
  const pipeline = redis.pipeline();
  if (action === 'GET') sortedKeys.forEach((key) => pipeline.get(key));
  if (action === 'DEL') keys.forEach((key) => pipeline.del(key));
  if (action === 'GET_ENTITY_ONLY') filteredKeysOfEntity.forEach((key) => pipeline.get(key));

  return await pipeline.exec();
};
