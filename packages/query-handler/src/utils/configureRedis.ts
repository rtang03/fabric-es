import IoRedis, { Redis, RedisOptions } from 'ioredis';

export const configureRedis: (option: RedisOptions) => Redis = option => {
  // do something to validate connection
  return new IoRedis(option);
};
