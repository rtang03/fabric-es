require('dotenv').config({ path: './.env' });
import redis from 'redis';
import { getLogger } from './getLogger';
import { relayService } from './relayService';
import retryStrategy from 'node-redis-retry-strategy';

const TARGET_URL = process.env.TARGET_URL;
const SERVICE_PORT = (process.env.SERVICE_PORT || 80) as number;
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = (process.env.REDIS_PORT || 6379) as number;
const TOPIC = process.env.REDIS_TOPIC;

const logger = getLogger('[relay] app.js');
const client = redis.createClient({host: REDIS_HOST, port: REDIS_PORT, retry_strategy: retryStrategy });

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