import { Redis } from 'ioredis';
import isEmpty from 'lodash/isEmpty';
import { getLogger } from './getLogger';
import { ReqRes } from './reqres';

const logger = getLogger('[relay] processMsg.js');

export const processMsg = ({
  message,
  client,
  topic,
  ttl,
}: {
  message: ReqRes; 
  client: Redis; 
  topic: string;
  ttl?: number;
}) => {
  return new Promise<number>((resolve, reject) => {
    if (isEmpty(message))
      reject(new Error('Message missing'));
    else if (isEmpty(client))
      reject(new Error('Client missing'));
    else if (isEmpty(topic))
      reject(new Error('Topic missing'));
    else {
      const messageStr = JSON.stringify(message);
      const timestamp = Date.now();
      const offset = ttl ? ttl : 86400000; // 1 day == 24x60x60x1000 milliseconds

      client.zremrangebyscore(topic, '-inf', (timestamp - offset));
      client.zadd(topic, timestamp, messageStr);

      client.publish(topic, messageStr).then(value => resolve(value));
    }
  });
};
