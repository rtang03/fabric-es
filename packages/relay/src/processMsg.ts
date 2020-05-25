require('dotenv').config({ path: './.env' });
import redis from 'redis';
import retryStrategy from 'node-redis-retry-strategy';
import { ReqRes } from './reqres';
import { getLogger } from './getLogger';

const TOPIC = "request-notify";
const HOST = process.env.REDIS_HOST;
const PORT = (process.env.REDIS_PORT || 6379) as number;
const EXPIRY = (process.env.REDIS_EXIPRY || 1209600) as number; // default 2 weeks
const logger = getLogger('[relay] processMsg.js');
const client = redis.createClient({port: PORT, host: HOST, retry_strategy: retryStrategy});

export const processMsg = (message: ReqRes) => {

  client.on('error', (err) => {
    console.log('Redis error:', err);
  });

  client.publish(TOPIC, JSON.stringify(message));
};
