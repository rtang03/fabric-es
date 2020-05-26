import redis from 'redis';
import { ReqRes } from './reqres';
import { getLogger } from './getLogger';

const logger = getLogger('[relay] processMsg.js');

export const processMsg = (message: ReqRes, client: redis.RedisClient, topic: string) => {

  client.on('error', (err) => {
    console.log('Redis error:', err);
  });

  const messageStr = JSON.stringify(message);
  client.publish(topic, messageStr, () => {logger.info(`Published message: ${messageStr}`)});
};