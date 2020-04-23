import { Redis } from 'ioredis';
import { TokenRepo } from '../entity/AccessToken';

export const createTokenRepo: (option: { redis: Redis; expiryInSeconds: number }) => TokenRepo = ({
  redis,
  expiryInSeconds
}) => ({
  save: async ({ key, value }) => redis.set(key, JSON.stringify(value), 'EX', expiryInSeconds),
  find: async ({ key }) => redis.get(key).then(token => JSON.parse(token))
});
