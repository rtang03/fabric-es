require('./env');
import util from 'util';
import { createGateway, getLogger } from '@fabric-es/gateway-lib';

const PORT = (process.env.GATEWAY_PORT || 4001) as number;
const authenticationCheck = process.env.AUTHORIZATION_SERVER_URI;
const logger = getLogger('app.js');

(async () => {
  const gateway = await createGateway({
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
    useCors: false,
    corsOrigin: 'http://localhost:3000',
    debug: false
  });

  process.on('uncaughtException', err => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  gateway.listen(PORT, () => {
    logger.info(`🚀 gateway ready at http://${process.env.GATEWAY_HOST}:${PORT}/graphql`);
    process.send?.('ready');
  });
})().catch(error => {
  console.error(error);
  logger.error(util.format('❌  fail to start app.js, %j', error));
  process.exit(1);
});
