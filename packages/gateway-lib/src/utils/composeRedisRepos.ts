import type { Commit, RedisearchDefinition, RedisRepository, EntityType } from '@fabric-es/fabric-cqrs';
import { createRedisRepository } from '@fabric-es/fabric-cqrs';
import type { RedisOptions } from 'ioredis';
import { Redisearch } from 'redis-modules-sdk';
import type { Selector } from 'reselect';
import { Logger } from 'winston';

export const composeRedisRepos: (
  client: Redisearch,
  redisRepos: Record<string, RedisRepository>
) => <TInput, TItemInRedis, TOutput>(
  entity: EntityType<TInput>,
  option: {
    fields: RedisearchDefinition<TInput>;
    preSelector?: Selector<[TInput, Commit[]?], TItemInRedis>;
    postSelector?: Selector<TItemInRedis, TOutput>;
}) => Record<string, RedisRepository> = (client, redisRepos) => <TInput, TItemInRedis, TOutput>(entity, {
  fields,
  preSelector,
  postSelector,
}) => {
  redisRepos[entity.entityName] = createRedisRepository<TInput, TItemInRedis, TOutput>(entity, {
    client,
    fields,
    postSelector,
    preSelector,
  });

  return Object.assign({}, redisRepos);
};

export const buildRedisOptions: (
  host: string, port: number, logger?: Logger
) => RedisOptions = (
  host, port, logger,
) => ({
  host, port,
  retryStrategy: (times) => {
    if (times > 3) {
      // the 4th return will exceed 10 seconds, based on the return value...
      logger?.error(`Redis: connection retried ${times} times, exceeded 10 seconds.`);
      process.exit(-1);
    }
    return Math.min(times * 100, 3000); // reconnect after (ms)
  },
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return 1;
    }
  },
});