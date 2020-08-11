import { getLogger } from './getLogger';
import { ReqRes } from './reqres';

export const END_POINTS = [
  '/user/inquiry',                              // GET ?sellerId=
  '/order/po',                                  // POST; PUT; multipart/form-data ???
  '/order/cancelPO',                            // POST
  '/etccorp/pboc/api/v1/po/process',            // POST
  '/etccorp/pboc/api/v1/invoices',              // POST; PUT; multipart/form-data ???
  '/etccorp/pboc/api/v1/invoices/notify',       // POST; multipart/form-data ???
  '/etccorp/pboc/api/v1/invoices/image/upload', // POST ?invoiceId= &imageDesc=; multipart/form-data ???
  '/invoice/result',                            // POST
  '/trade-financing/invresult'                  // POST
];
export type END_POINTS = typeof END_POINTS[number];

const logger = getLogger('[sniffer] processNtt.js');

// (channel: string, message: ReqRes, messageStr?: string) => void
export const processEntity = (channel: string, message: ReqRes, messageStr?: string): void => {
  if (message) {
    logger.info(`Processing incoming message ${message.method} ${message.url.url}`);

    const isQueryEmpty = (Object.keys(message.url.query).length <= 0) && (message.url.query.constructor === Object);
    const isJsonPayload = message.contentType && (message.contentType === 'application/json');
    switch (message.url.url) {
      case END_POINTS[1]: // /order/po
        if (!isQueryEmpty) {
          console.log(`Received message on '${message.url.url}' with query string: '${JSON.stringify(message.url.query)}': '${JSON.stringify(message)}'`); // TODO TEMP!!!
        } else if (!isJsonPayload) {
          console.log(`Received message on '${message.url.url}' with non-JSON payload (${message.contentType}): '${JSON.stringify(message)}'`); // TODO TEMP!!!
        } else {
          console.log(`Processing '${message.reqBody}'...`); // TODO TEMP!!!
        }
        break;

      default:
        logger.info(`Unhandled message '${JSON.stringify(message)}'`);
        break;
    }
  } else if (messageStr) {
    logger.warn(`Incoming message with invalid format: '${messageStr}'`);
  } else {
    logger.error('Incoming message missing');
  }
};