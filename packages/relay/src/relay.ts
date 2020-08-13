require('dotenv').config({ path: './.env' });
import util from 'util';
import { getLogger } from './getLogger';
import { createRelayService } from './relayService';

const SERVICE_PORT = process.env.RELAY_PORT || 80;
const targetUrl = process.env.TARGET_URL;
const redisHost = process.env.REDIS_HOST;
const redisPort = (process.env.REDIS_PORT || 6379) as number;
const topic = process.env.REDIS_TOPIC;

const logger = getLogger('[relay] relay.js');

(async () => {
  logger.info('♨️♨️  Starting [relay] service...');
  const myArgs = process.argv.slice(2);
  const httpsArg = myArgs[0];

  const { relay, shutdown } = await createRelayService({
    targetUrl, redisHost, redisPort, topic, httpsArg
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

  relay.listen(SERVICE_PORT, () => {
    logger.info(`🚀 relay ready at ${SERVICE_PORT}`);
    if (process.env.NODE_ENV === 'production') process.send('ready');
  });
  // server.timeout = 600000; which: server = relay.listen(....)
})().catch(error => {
  console.error(error);
  logger.error(util.format('fail to start relay.js, %j', error));
  process.exit(1);
});