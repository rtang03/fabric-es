import { ApolloServer } from 'apollo-server';
import util from 'util';

export const shutdown = ({
  logger, name = 'service'
}: {
  logger: any;
  name?: string;
}) =>
  async (server: ApolloServer) => {
    server.stop()
      .then(() => {
        logger.info(`${name} stopped`);
        process.exit(0);
      })
      .catch(err => {
        logger.error(util.format(`An error occurred while shutting down ${name}: %j`, err));
        process.exit(1);
      });
  };
