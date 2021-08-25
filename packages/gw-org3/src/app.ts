require('./env');
import util from 'util';
import { createGateway, getLogger, IS_HTTPS } from '@fabric-es/gateway-lib';
import express, { Express, Response } from 'express';

const PORT = (process.env.GATEWAY_PORT || 4001) as number;
const authenticationCheck = process.env.AUTHORIZATION_SERVER_URI;
const logger = getLogger('[gw-org3] app.js');

(async () => {
  logger.info('♨️♨️  Starting [gw-org3] gateway');

  const gatewayName = 'ORG-3';
  const gateway = await createGateway({
    serviceList: [
      {
        name: 'loan',
        url: `http://${process.env.SERVICE_LOAN_HOST}:${process.env.SERVICE_LOAN_PORT}/graphql`
      },
      {
        name: 'document',
        url: `http://${process.env.SERVICE_DOCUMENT_HOST}:${process.env.SERVICE_DOCUMENT_PORT}/graphql`
      },
      {
        name: 'loanDetails',
        url: `http://${process.env.PRIVATE_LOAN_DETAILS_HOST}:${process.env.PRIVATE_LOAN_DETAILS_PORT}/graphql`
      },
      {
        name: 'docContents',
        url: `http://${process.env.PRIVATE_DOC_CONTENTS_HOST}:${process.env.PRIVATE_DOC_CONTENTS_PORT}/graphql`
      },
    ],
    authenticationCheck,
    useCors: false,
    corsOrigin: 'http://localhost:3000',
    debug: false,
    gatewayName,
    adminHost: process.env.ADMINISTRATOR_HOST,
    adminPort: parseInt(process.env.ADMINISTRATOR_PORT, 10),
    certPath: process.env.CERT_PATH_CERT,
    certKeyPath: process.env.CERT_PATH_KEY,
  }, (catalog: string, app: Express) => {
    app.use(express.static('html', { index: false }));
    return ((_, res: Response) => {
      res.setHeader('content-type', 'text/html; charset=UTF-8');
      res.send(`<!DOCTYPE html><html><title>${gatewayName}</title><xmp theme="Spacelab" style="display:none;">${catalog}</xmp><script src="strapdown.js"></script></html>`);
    });
  });

  process.on('uncaughtException', err => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  gateway.listen(PORT, () => {
    logger.info(`🚀 gateway ready at ${gateway[IS_HTTPS] ? 'https' : 'http'}://${process.env.GATEWAY_HOST || '127.0.0.1'}:${PORT}/graphql`);
    process?.send?.('ready');
  });
})().catch(error => {
  console.error(error);
  logger.error(util.format('❌  fail to start app.js, %j', error));
  process.exit(1);
});
