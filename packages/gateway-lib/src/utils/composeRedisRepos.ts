import type { Commit, RedisearchDefinition, RedisRepository, EntityType } from '@fabric-es/fabric-cqrs';
import { createRedisRepository } from '@fabric-es/fabric-cqrs';
import { Redisearch } from 'redis-modules-sdk';
import type { Selector } from 'reselect';

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
