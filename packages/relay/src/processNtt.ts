import { getLogger } from './getLogger';
import { ReqRes } from './reqres';
import { ProcessResults } from './snifferService';

const logger = getLogger('[sniffer] processNtt.js');

export const getEntityProcessor = (process: (message: ReqRes) => ProcessResults) => {
  return (channel: string, message: ReqRes, messageStr?: string): void => {
    if (message) {
      const result = process(message);
      if (!result.errors) {
        const { statusMessage, reqBody, resBody, errors, ...rest } = result;
        console.log('Events', JSON.stringify(rest, null, ' ')); // TODO write events to blockchain
      } else {
        const { reqBody, resBody, events, ...rest } = result;
        logger.error('Error processing entity: ' + JSON.stringify(rest, null, ' '));
      }
    } else if (messageStr) {
      logger.warn(`Incoming message with invalid format: '${messageStr}'`);
    } else {
      logger.error('Incoming message missing');
    }
  };
};
