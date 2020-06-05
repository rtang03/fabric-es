import type { Redis } from 'ioredis';

export const pipelineExecute = async (redis: Redis, action: 'GET' | 'DEL', pattern: string) => {
  const keys = await redis.keys(pattern);
  const sortedKeys = keys.sort();
  const pipeline = redis.pipeline();
  if (action === 'GET') sortedKeys.forEach((key) => pipeline.get(key));
  if (action === 'DEL') keys.forEach((key) => pipeline.del(key));
  return await pipeline.exec();
};
