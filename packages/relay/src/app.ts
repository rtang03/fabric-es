require('dotenv').config({ path: './.env' });
import redis from 'redis';
import { getLogger } from './getLogger';
import { relayService } from './relayService';

const TARGET_URL = process.env.TARGET_URL;
const SERVICE_PORT = (parseInt(process.env.SERVICE_PORT) || 80) as number;
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = (parseInt(process.env.REDIS_PORT) || 6379) as number;
const TOPIC = process.env.REDIS_TOPIC;

const logger = getLogger('[relay] app.js');
const client = redis.createClient({host: REDIS_HOST, port: REDIS_PORT,
  retry_strategy: (options) => {
    if (options.error) {
      const e = options.error;
      logger.error(`${e.message}(${e.code}).`);
    }
		if (options.total_retry_time > 1000 * 10) { //in ms i.e. 10 sec
      logger.error(`Redis: connection retry time exceeded 10 seconds.`);  
      process.exit(-1);
    }
		// reconnect after
		return Math.min(options.attempt * 100, 3000); //in ms
	}
});

client.on('error', (err) => {
  logger.error(`Redis Error: ${err}`);
}); 

try {
  relayService({
    targetUrl: TARGET_URL,
    client: client,
    topic: TOPIC
  }).listen(SERVICE_PORT, () => {
    logger.info(`Relay server is now running on port ${SERVICE_PORT}.`);
  })
} catch (error) {
  logger.error(error);
  process.exit(-1);
};