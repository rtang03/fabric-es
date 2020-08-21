require('dotenv').config({ path: './.env' });
import util from 'util';
import { getReducer } from '@fabric-es/fabric-cqrs';
import { Wallets } from 'fabric-network';
import Redis from 'ioredis';
import { getLogger } from './getLogger';
import { getPbocEtcEntityProcessor, PO, PoEvents, poReducer } from './pbocEtc';
import { getEntityProcessor } from './processNtt';
import { createSnifferService } from './snifferService';

const SERVICE_PORT = process.env.SNIFFER_PORT || 80;
const redisHost = process.env.REDIS_HOST;
const redisPort = (process.env.REDIS_PORT || 6379) as number;
const topic = process.env.REDIS_TOPIC;

const logger = getLogger('[sniffer] sniffer.js');

(async () => {
  logger.info('♨️♨️  Starting [sniffer] service...');

  getEntityProcessor({
    enrollmentId: process.env.ORG_ADMIN_ID,
    channelName: process.env.CHANNEL_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
    asLocalhost: !(process.env.NODE_ENV === 'production'),
    redis: new Redis({ host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT, 10) }),
  }).then(async ({ getRepository, addRepository }) => {
    const callback = addRepository(getRepository<PO, PoEvents>('po', getReducer<PO, PoEvents>(poReducer)))
    // .addRepository(getRepository<Invoice, InvoiceEvents>('invoice', getReducer<Invoice, InvoiceEvents>(invoiceReducer))) // TODO
    .create(getPbocEtcEntityProcessor);

    const { sniffer, shutdown } = await createSnifferService({
      redisHost, redisPort, topic, callback
    });
  
    process.on('SIGINT', async () => {
      process.exit(await shutdown());
    });
  
    process.on('SIGTERM', async () => {
      process.exit(await shutdown());
    });
  
    process.on('uncaughtException', err => {
      logger.error('An uncaught error occurred!');
      logger.error(err.stack);
    });
  
    sniffer.listen(SERVICE_PORT, () => {
      logger.info(`🚀 sniffer ready at ${SERVICE_PORT}`);
      process.send?.('ready');
    });  
  }).catch(error => {
    logger.error(util.format('error starting sniffer.js, %j', error));
    process.exit(1);
  });
})().catch(error => {
  logger.error(util.format('fail to start sniffer.js, %j', error));
  process.exit(1);
});