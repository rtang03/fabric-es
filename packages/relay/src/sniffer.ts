require('dotenv').config({ path: './.env' });
import util from 'util';
import { getLogger } from './getLogger';
import { processPbocEtcEntity } from './pbocEtc';
import { getEntityProcessor } from './processNtt';
import { createSnifferService } from './snifferService';

const SERVICE_PORT = process.env.SNIFFER_PORT || 80;
const redisHost = process.env.REDIS_HOST;
const redisPort = (process.env.REDIS_PORT || 6379) as number;
const topic = process.env.REDIS_TOPIC;

const logger = getLogger('[sniffer] sniffer.js');

(async () => {
  logger.info('♨️♨️  Starting [sniffer] service...');

  const { sniffer, shutdown } = await createSnifferService({
    redisHost, redisPort, topic, callback: getEntityProcessor(processPbocEtcEntity)
  });

  process.on('SIGINT', async () => {
    shutdown();
  });

  process.on('SIGTERM', async () => {
    shutdown();
  });

  process.on('uncaughtException', err => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  sniffer.listen(SERVICE_PORT, () => {
    logger.info(`🚀 sniffer ready at ${SERVICE_PORT}`);
    if (process.env.NODE_ENV === 'production') process.send('ready');
  });
})().catch(error => {
  console.error(error);
  logger.error(util.format('fail to start sniffer.js, %j', error));
  process.exit(1);
});