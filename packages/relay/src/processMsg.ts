import _ from 'lodash';
import { ReqRes } from './reqres';
import { getLogger } from './getLogger';

const logger = getLogger('[relay] processMsg.js');

export const processMsg = async ({
  message, 
  client, 
  topic
}: {
  message: ReqRes; 
  client: any; 
  topic: string
}) => {

  if (_.isEmpty(message)) throw new Error('Missing message.');
  if (_.isEmpty(client)) throw new Error('Missing client');
  if (_.isEmpty(topic)) throw new Error('Missing topic.');

  client.on('error', (err) => {
    throw new Error(`Publish client error: ${err}`);
  });

  const messageStr = JSON.stringify(message);
  await client.publish(topic, messageStr, () => { logger.info(`Published message: ${messageStr}`) });
};