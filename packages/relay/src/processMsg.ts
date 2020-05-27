import _ from 'lodash';
import redis from 'redis';
import { ReqRes } from './reqres';
import { getLogger } from './getLogger';

const logger = getLogger('[relay] processMsg.js');

export const processMsg = (message: ReqRes, client: redis.RedisClient, topic: string) => {

  if (_.isEmpty(message)) throw new Error('Missing message.');
  if (_.isEmpty(client)) throw new Error('Missing client');
  if (_.isEmpty(topic)) throw new Error('Missing topic.');

  client.on('error', (err) => {
    console.log('Redis error:', err);
  });

  const messageStr = JSON.stringify(message);
  client.publish(topic, messageStr, () => {logger.info(`Published message: ${messageStr}`)});
};