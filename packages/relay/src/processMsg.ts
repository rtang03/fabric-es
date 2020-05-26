require('dotenv').config({ path: './.env' });
import redis from 'redis';
import retryStrategy from 'node-redis-retry-strategy';
import { ReqRes } from './reqres';
import { getLogger } from './getLogger';

const HOST = process.env.REDIS_HOST;
const PORT = (process.env.REDIS_PORT || 6379) as number;
const TOPIC = process.env.REDIS_TOPIC;
const logger = getLogger('[relay] processMsg.js');
const client = redis.createClient({port: PORT, host: HOST, retry_strategy: retryStrategy});

export const processMsg = (message: ReqRes, client: redis.RedisClient) => {

  client.on('error', (err) => {
    console.log('Redis error:', err);
  });

  const messageStr = JSON.stringify(message);
  client.publish(TOPIC, messageStr, () => {logger.info(`Published message: ${messageStr}`)});
};
