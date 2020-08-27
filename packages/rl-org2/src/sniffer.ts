require('dotenv').config({ path: './.env' });
import util from 'util';
import { getReducer } from '@fabric-es/fabric-cqrs';
import { getLogger } from '@fabric-es/gateway-lib';
import {
  getPbocEtcEntityProcessor, Invoice, InvoiceEvents, invoiceReducer, PO, PoEvents, poReducer
} from '@fabric-es/model-pboc';
import {
  createSnifferService, getEntityProcessor
} from '@fabric-es/relay-lib';
import { Wallets } from 'fabric-network';
import Redis from 'ioredis';

const SERVICE_PORT = process.env.SNIFFER_PORT || 80;
const redisHost = process.env.REDIS_HOST;
const redisPort = (process.env.REDIS_PORT || 6379) as number;
const topic = process.env.REDIS_TOPIC;

const logger = getLogger('[rl-org3] sniffer.js');

(async () => {
  logger.info('♨️♨️  Starting [rl-org3] sniffer service...');

  getEntityProcessor({
    enrollmentId: process.env.ORG_ADMIN_ID,
    channelName: process.env.CHANNEL_NAME,
    connectionProfile: process.env.CONNECTION_PROFILE,
    wallet: await Wallets.newFileSystemWallet(process.env.WALLET),
    asLocalhost: !(process.env.NODE_ENV === 'production'),
    redis: new Redis({ host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT, 10) }),
  }).then(async ({ getRepository, addRepository }) => {
    const callback = addRepository(getRepository<PO, PoEvents>('po', getReducer<PO, PoEvents>(poReducer)))
      .addRepository(getRepository<Invoice, InvoiceEvents>('invoice', getReducer<Invoice, InvoiceEvents>(invoiceReducer)))
      .create(getPbocEtcEntityProcessor);

    const { sniffer, shutdown } = await createSnifferService({
      redisOptions: {
        host: redisHost,
        port: redisPort,
        retryStrategy: (times) => {
          if (times > 3) { // the 4th return will exceed 10 seconds, based on the return value...
            logger.error(`Redis: connection retried ${times} times, exceeded 10 seconds.`);
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
        }
      }, topic, callback
    });

    process.on('SIGINT', async () => {
      await shutdown().catch(process.exit(1));
      process.exit(0);
    });
  
    process.on('SIGTERM', async () => {
      await shutdown().catch(process.exit(1));
      process.exit(0);
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