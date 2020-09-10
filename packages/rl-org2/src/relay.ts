require('dotenv').config({ path: './.env' });
import util from 'util';
import { getLogger } from '@fabric-es/gateway-lib';
import { createRelayService } from '@fabric-es/relay-lib';

const SERVICE_PORT = process.env.RELAY_PORT || 80;
const targetUrl = process.env.TARGET_URL;
const redisHost = process.env.REDIS_HOST;
const redisPort = (process.env.REDIS_PORT || 6379) as number;
const topic = process.env.REDIS_TOPIC;

const logger = getLogger('[rl-org2] relay.js');

(async () => {
  logger.info(`♨️♨️  Starting relay service... ${targetUrl} ${redisHost}:${redisPort} ${topic}`);
  const httpsArg = process.argv.slice(2)[0];

  const { isHttps, relay, shutdown } = await createRelayService({
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
    }, targetUrl, topic, httpsArg
  });

  process.on('SIGINT', async () =>
    await shutdown()
      .then(() => process.exit(0))
      .catch(() => process.exit(1)));

  process.on('SIGTERM', async () => 
    await shutdown()
      .then(() => process.exit(0))
      .catch(() => process.exit(1)));

  process.on('uncaughtException', err => {
    logger.error('An uncaught error occurred!');
    logger.error(err.stack);
  });

  relay.listen(SERVICE_PORT, () => {
    logger.info(`🚀 relay ready at  ${isHttps ? 'https://' : ''}${SERVICE_PORT}`);
    process.send?.('ready');
  });
  // server.timeout = 600000; which: server = relay.listen(....)
})().catch(error => {
  console.error(error);
  logger.error(util.format('fail to start relay.js, %j', error));
  process.exit(1);
});