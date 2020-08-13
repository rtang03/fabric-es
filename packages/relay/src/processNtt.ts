import { getLogger } from './getLogger';
import { ReqRes } from './reqres';

const logger = getLogger('[sniffer] processNtt.js');

export interface ProcessResults {
  endPoint: string;
  method: string;
  statusCode: number;
  statusMessage?: string;
  reqBody?: string;
  resBody?: string;
  errors?: string[];
  events?: {
    type: string;
    payload: any;
  }[];
  attachmentInfo?: {
    name: string;
    type: string;
  }[];
};

export const getEntityProcessor = (process: (message: ReqRes) => ProcessResults) => {
  return (channel: string, message: ReqRes, messageStr?: string): void => {
    if (message) {
      const result = process(message);
      if (result.errors) {
        const { reqBody, resBody, events, ...rest } = result;
        console.log('ERROR', JSON.stringify(rest, null, ' '));
      } else {
        const { statusMessage, reqBody, resBody, errors, ...rest } = result;
        console.log('Events', JSON.stringify(rest, null, ' '));
      }
    } else if (messageStr) {
      logger.warn(`Incoming message with invalid format: '${messageStr}'`);
    } else {
      logger.error('Incoming message missing');
    }
  };
};
