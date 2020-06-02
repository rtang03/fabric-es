import isEmpty from 'lodash/isEmpty';
import { ReqRes } from './reqres';
import { getLogger } from './getLogger';
import { RedisClient } from 'redis';

const logger = getLogger('[relay] processMsg.js');

export const processMsg = ({
  message, 
  client, 
  topic
}: {
  message: ReqRes; 
  client: RedisClient; 
  topic: string
}) => {

  if (isEmpty(message)) return Promise.reject(new Error('Missing message.'));
  if (isEmpty(client)) return Promise.reject(new Error('Missing client'));
  if (isEmpty(topic)) return Promise.reject(new Error('Missing topic.'));

  return new Promise<number>((resolve, reject) => {  
    const messageStr = JSON.stringify(message);
    client.publish(topic, messageStr, (err, reply) => {

      if (err)
        reject(err);
      else {
        logger.info(`Published to '${topic}[${reply}]': ${messageStr}`);
        resolve(reply);
      }
    });
  });

};