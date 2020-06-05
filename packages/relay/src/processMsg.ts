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
  topic: string;
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

export const processMsgHandler = async ({
  message,
  client,
  topic
}: {
  message: ReqRes,
  client: RedisClient,
  topic: string
}) => {

  await processMsg({ message: message, client: client, topic: topic }).then(
    (numberOfSubscribers) => {
      // Opps.. no subscriber is listening. Save record to Redis at best effort.
      if (numberOfSubscribers == 0) {
        logger.error('No subscriber is listening for message [' + message.id +
          ']. Attempting to save message to Redis.');
        const messageStr = JSON.stringify(message);
        logger.info(messageStr);
        client.set(message.id, messageStr);
      }
    }
  ).catch((error) => {
    logger.error(`Error while processing [${message.id}]: ${error}`);
    logger.info(JSON.stringify(message));
  });
};