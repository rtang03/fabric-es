import util from 'util';
import { ApolloServer } from 'apollo-server';
import { Redis } from 'ioredis';
import { Logger } from 'winston';
import { REDIS_CONNECTION_CLOSED } from '../queryHandler';

/**
 * @ignore
 */
export const shutdownApollo = ({
  redis,
  logger,
  name = 'service',
}: {
  redis?: Redis;
  logger: Logger;
  name?: string;
}) => async (server: ApolloServer): Promise<void> =>
  new Promise<void>(async (resolve, reject) => {
    if (redis)
      redis.quit().catch((err) => {
        if (err.message !== REDIS_CONNECTION_CLOSED) logger.error(`Error disconnecting client from redis: ${err}`);
      });

    return server
      .stop()
      .then(() => {
        logger.info(`${name} stopped`);
        resolve();
      })
      .catch((err) => {
        logger.error(util.format(`An error occurred while shutting down %s: %j`, name, err));
        reject();
      });
  });
