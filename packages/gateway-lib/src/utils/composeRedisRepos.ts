import type { Commit, RedisearchDefinition, RedisRepository } from '@fabric-es/fabric-cqrs';
import { createRedisRepository } from '@fabric-es/fabric-cqrs';
import { Redisearch } from 'redis-modules-sdk';
import type { Selector } from 'reselect';

export const composeRedisRepos: (
  client: Redisearch,
  redisRepos: Record<string, RedisRepository>
) => <TInput, TItemInRedis, TOutput>(option: {
  entityName: string;
  fields: RedisearchDefinition<TInput>;
  preSelector?: Selector<[TInput, Commit[]?], TItemInRedis>;
  postSelector?: Selector<TItemInRedis, TOutput>;
}) => Record<string, RedisRepository> = (client, redisRepos) => <TInput, TItemInRedis, TOutput>({
  entityName,
  fields,
  preSelector,
  postSelector,
}) => {
  redisRepos[entityName] = createRedisRepository<TInput, TItemInRedis, TOutput>({
    client,
    entityName,
    fields,
    postSelector,
    preSelector,
  });

  return Object.assign({}, redisRepos);
};
