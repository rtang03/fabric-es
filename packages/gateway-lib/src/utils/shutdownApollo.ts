/**
 * @packageDocumentation
 * @hidden
 */
import util from 'util';
import { ApolloServer } from 'apollo-server';
import { Logger } from 'winston';

export const shutdownApollo = ({ logger, name = 'service' }: { logger: Logger; name?: string }) => async (
  server: ApolloServer
): Promise<void> => {
  return new Promise<void>(async (resolve, reject) => {
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
};
