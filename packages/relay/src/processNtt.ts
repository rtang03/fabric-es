import { getLogger } from './getLogger';
import { ReqRes } from './reqres';

const logger = getLogger('[sniffer] processNtt.js');

export const getEntityProcessor = (process: (message: ReqRes) => void) => {
  return (channel: string, message: ReqRes, messageStr?: string): void => {
    if (message) {
      logger.info(`Processing incoming message ${message.method} ${message.url.url}`);
      process(message);
    } else if (messageStr) {
      logger.warn(`Incoming message with invalid format: '${messageStr}'`);
    } else {
      logger.error('Incoming message missing');
    }
  };
};
