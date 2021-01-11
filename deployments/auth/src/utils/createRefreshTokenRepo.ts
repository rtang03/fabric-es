import { Redis } from 'ioredis';
import { RefreshTokenRepo } from '../entity/RefreshToken';

export const createRefreshTokenRepo: (option: {
  redis: Redis;
  refTokenExpiryInSec: number;
}) => RefreshTokenRepo = ({ redis, refTokenExpiryInSec }) => ({
  save: async ({ user_id, refresh_token, useDefaultExpiry, access_token, is_admin }) => {
    const key = `rt::${user_id}::${refresh_token}`;
    const value = {
      refresh_token,
      user_id,
      access_token,
      expires_at: Date.now() + refTokenExpiryInSec * 1000,
      is_admin,
    };

    return useDefaultExpiry
      ? redis.set(key, JSON.stringify(value), 'EX', refTokenExpiryInSec)
      : redis.set(key, JSON.stringify(value));
  },
  find: async (token) => {
    const keys = await redis.keys(`rt::*::${token}`);
    return keys?.[0] ? await redis.get(keys[0]).then((token) => JSON.parse(token)) : null;
  },
  deleteToken: async (user_id, token) => redis.del(`rt::${user_id}::${token}`),
});
