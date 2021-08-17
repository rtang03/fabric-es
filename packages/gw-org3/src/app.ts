require('./env');
import util from 'util';
import { createGateway, getLogger, IS_HTTPS } from '@fabric-es/gateway-lib';

const PORT = (process.env.GATEWAY_PORT || 4001) as number;
const authenticationCheck = process.env.AUTHORIZATION_SERVER_URI;
const logger = getLogger('[gw-org3] app.js');

(async () => {
  logger.info('♨️♨️  Starting [gw-org3] gateway');

  const gateway = await createGateway({
    serviceList: [
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
    ],
    authenticationCheck,
    useCors: false,
    corsOrigin: 'http://localhost:3000',
    debug: false,
    gatewayName: 'ORG-3',
    adminHost: process.env.GATEWAY_HOST,
    adminPort: parseInt(process.env.ADMINISTRATOR_PORT, 10),
    certPath: process.env.CERT_PATH_CERT,
    certKeyPath: process.env.CERT_PATH_KEY,
  });

  process.on('uncaughtException', err => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  gateway.listen(PORT, () => {
    logger.info(`🚀 gateway ready at ${gateway[IS_HTTPS] ? 'https' : 'http'}://${process.env.GATEWAY_HOST}:${PORT}/graphql`);
    process?.send?.('ready');
  });
})().catch(error => {
  console.error(error);
  logger.error(util.format('❌  fail to start app.js, %j', error));
  process.exit(1);
});
