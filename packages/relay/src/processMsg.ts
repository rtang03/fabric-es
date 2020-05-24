require('dotenv').config({ path: './.env.example' });
import redis from 'redis';
import { ReqRes } from './reqres';
import { getLogger } from './getLogger';

const HOST = process.env.REDIS_HOST;
const PORT = (process.env.REDIS_PORT || 6379) as number;
const EXPIRY = (process.env.REDIS_EXIPRY || 1209600) as number; // default 2 weeks
const logger = getLogger('[relay] processMsg.js');
const client = redis.createClient(PORT, HOST);

export const processMsg = (message: ReqRes) => {

  client.on('connect', function () {
    console.log('connected');
  });

  client.set(message.id, message);
  client.expiry(message.id, EXPIRY);
  client.quit(redis.print); 
};
