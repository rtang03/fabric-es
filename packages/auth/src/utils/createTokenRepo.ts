import { Redis } from 'ioredis';
import { TokenRepo } from '../entity/AccessToken';

export const createTokenRepo: (option: { redis: Redis; jwtExpiryInSec: number }) => TokenRepo = ({
  redis,
  jwtExpiryInSec,
}) => ({
  save: async (user_id, access_token, useDefaultExpiry, client_id) => {
    const key = `at::${user_id}::${access_token}`;
    const value = { access_token, user_id, expires_at: Date.now() + jwtExpiryInSec * 1000 };
    client_id && Object.assign(value, { client_id });

    return useDefaultExpiry
      ? redis.set(key, JSON.stringify(value), 'EX', jwtExpiryInSec)
      : redis.set(key, JSON.stringify(value));
  },
  find: async (token) => {
    const keys = await redis.keys(`at::*::${token}`);
    return keys?.[0] ? await redis.get(keys[0]).then((token) => JSON.parse(token)) : null;
  },
  findByUserId: async (id) => {
    const keys = await redis.keys(`at::${id}::*`);
    const result = [];
    for await (const key of keys)
      await redis.get(key).then((token) => result.push(JSON.parse(token)));
    return result;
  },
  deleteToken: async (user_id, token) => redis.del(`at::${user_id}::${token}`),
});
