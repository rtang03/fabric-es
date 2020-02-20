require('./env');
import { createGateway, getLogger } from '@espresso/gw-node';
import http from 'http';
import stoppable from 'stoppable';
import util from 'util';

const PORT = (process.env.GATEWAY_PORT || 4001) as number;
const authenticationCheck = process.env.AUTHORIZATION_SERVER_URI;
const logger = getLogger('app.js');

(async () => {
  const server = await createGateway({
    serviceList: [
      {
        name: 'user',
        url: `http://${process.env.GATEWAY_HOST}:${process.env.SERVICE_USER_PORT}/graphql`
      },
      {
        name: 'loan',
        url: `http://${process.env.GATEWAY_HOST}:${process.env.SERVICE_LOAN_PORT}/graphql`
      },
      {
        name: 'document',
        url: `http://${process.env.GATEWAY_HOST}:${process.env.SERVICE_DOCUMENT_PORT}/graphql`
      },
      {
        name: 'loanDetails',
        url: `http://${process.env.GATEWAY_HOST}:${process.env.PRIVATE_LOAN_DETAILS_PORT}/graphql`
      },
      {
        name: 'docContents',
        url: `http://${process.env.GATEWAY_HOST}:${process.env.PRIVATE_DOC_CONTENTS_PORT}/graphql`
      },
      {
        name: 'admin',
        url: `http://${process.env.GATEWAY_HOST}:${process.env.ADMINISTRATOR_PORT}/graphql`
      }
    ],
    authenticationCheck,
    useCors: true,
    debug: false
  });

  const stoppableServer = stoppable(http.createServer(server));

  const shutdown = () => {
    stoppableServer.close(err => {
      if (err) {
        logger.error(
          util.format('An error occurred while closing the server: %j', err)
        );
        process.exitCode = 1;
      } else logger.info('server closes');
    });
    process.exit();
  };

  process.on('SIGINT', () => {
    shutdown();
  });

  process.on('SIGTERM', () => {
    shutdown();
  });

  process.on('uncaughtException', err => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  stoppableServer.listen(PORT, '0.0.0.0', () => {
    console.log(
      `🚀 Server at http://${process.env.GATEWAY_HOST}:${PORT}/graphql`
    );
    logger.info(
      `🚀 Server at http://${process.env.GATEWAY_HOST}:${PORT}/graphql`
    );
    process.send('ready');
  });
})().catch(error => {
  console.error(error);
  logger.error(util.format('fail to start app.js, %j', error));
  process.exit(1);
});
