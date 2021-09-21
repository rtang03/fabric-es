import Debug from 'debug';
import type { RedisOptions } from 'ioredis';
import { Logger } from 'winston';

export const buildRedisOptions: (host: string, port: number, logger?: Logger) => RedisOptions = (
  host,
  port,
  logger
) => {
  const debug = Debug('gw-lib:utils:buildRedisOptions');

  return {
    host,
    port,
    retryStrategy: (times) => {
      debug('Redis: connection retried %s times', times);

      if (times > 10) {
        // the 4th return will exceed 10 seconds, based on the return value...
        logger?.error(`Redis: connection retried ${times} times, exceeded 10 seconds.`);
        process.exit(-1);
      }
      return Math.min(times * 100, 3000); // reconnect after (ms)
    },
    reconnectOnError: (err) => {
      const targetError = 'READONLY';

      debug('reconnectOnError, %O', err);

      if (err.message.includes(targetError)) {
        // Only reconnect when the error contains "READONLY"
        return 1;
      }
    },
  };
};
