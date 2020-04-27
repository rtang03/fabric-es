import { Redis } from 'ioredis';
import { TokenRepo } from '../entity/AccessToken';

export const createTokenRepo: (option: { redis: Redis; expiryInSeconds: number }) => TokenRepo = ({
  redis,
  expiryInSeconds
}) => ({
  save: async ({ key, value, useDefaultExpiry }) =>
    useDefaultExpiry
      ? redis.set(key, JSON.stringify(value), 'EX', expiryInSeconds)
      : redis.set(key, JSON.stringify(value)),
  find: async ({ key }) => redis.get(key).then(token => JSON.parse(token)),
  deleteToken: async ({ key }) => redis.del(key)
});
