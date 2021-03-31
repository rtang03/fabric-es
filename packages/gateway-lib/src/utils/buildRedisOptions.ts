import type { RedisOptions } from 'ioredis';
import { Logger } from 'winston';

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
