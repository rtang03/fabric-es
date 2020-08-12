import { getLogger } from './getLogger';
import { ReqRes } from './reqres';

const logger = getLogger('[sniffer] pbocEtc.js');

export const EndPoints = [
  '/user/inquiry',                              // 0 GET ?sellerId=
  '/order/po',                                  // 1 POST; PUT; multipart/form-data ???
  '/order/cancelPO',                            // 2 POST
  '/etccorp/pboc/api/v1/po/process',            // 3 POST
  '/etccorp/pboc/api/v1/invoices',              // 4 POST; PUT; multipart/form-data ???
  '/etccorp/pboc/api/v1/invoices/notify',       // 5 POST; multipart/form-data ???
  '/etccorp/pboc/api/v1/invoices/image/upload', // 6 POST ?invoiceId= &imageDesc=; multipart/form-data ???
  '/invoice/result',                            // 7 POST
  '/trade-financing/invresult'                  // 8 POST
];
export type EndPoints = typeof EndPoints[number];

export const processPbocEtcEntity = (message: ReqRes) => {
  const {
    id, startTime, duration, method, url, contentType, reqBody, resBody, attachmentInfo, statusCode, statusMessage
  } = message;

  let isFileUpload = false;
  let isJsonPayload = false;
  let jsonObj;
  let jsonDat;
  if (contentType) {
    if (contentType === 'multipart/form-data') {
      if (attachmentInfo && (attachmentInfo.name !== '')) isFileUpload = true;

      try {
        jsonDat = JSON.parse(reqBody);
      } catch (error) {
        jsonDat = reqBody;
      }

      if (jsonDat['jsonObj']) {
        isJsonPayload = true;
        try {
          jsonObj = JSON.parse(jsonDat['jsonObj']);
        } catch (error) {
          jsonObj = jsonDat['jsonObj'];
        }
      }
    } else if (contentType === 'application/json') {
      isJsonPayload = true;
      jsonObj = reqBody;
    }
  }

  const noQueryParam = (Object.keys(url.query).length <= 0) && (url.query.constructor === Object);
  const isPost = method === 'POST';
  const isPut = method === 'PUT';
  const isGet = method === 'GET';

  switch (url.url) {
    case EndPoints[1]: // /order/po
      if (!noQueryParam) {
        logger.info(`Received '${url.url}' with query string: '${JSON.stringify(url.query)}': '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else if (!isJsonPayload) {
        logger.info(`Received '${url.url}' with non-JSON payload (${contentType}): '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else if (!isPost && !isPut) {
        logger.info(`Received '${url.url}' with unsupported (${method}) action: '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else {
        logger.info(`${isPost ? 'Create' : 'Update'} PO with ${attachmentInfo ? attachmentInfo : 'no attachment'}: '${JSON.stringify(jsonObj, null, ' ')}'`); // TODO TEMP!!!
      }
      break;

    case EndPoints[2]: // /order/cancelPO
      if (!noQueryParam) {
        logger.info(`Received '${url.url}' with query string: '${JSON.stringify(url.query)}': '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else if (!isJsonPayload) {
        logger.info(`Received '${url.url}' with non-JSON payload (${contentType}): '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else if (!isPost) {
        logger.info(`Received '${url.url}' with unsupported (${method}) action: '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else {
        logger.info(`Cancel PO: '${JSON.stringify(jsonDat, null, ' ')}'`); // TODO TEMP!!!
      }
      break;

    case EndPoints[3]: // /etccorp/pboc/api/v1/po/process
      if (!noQueryParam) {
        logger.info(`Received '${url.url}' with query string: '${JSON.stringify(url.query)}': '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else if (!isJsonPayload) {
        logger.info(`Received '${url.url}' with non-JSON payload (${contentType}): '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else if (!isPost) {
        logger.info(`Received '${url.url}' with unsupported (${method}) action: '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else {
        logger.info(`Process PO: '${JSON.stringify(jsonDat, null, ' ')}'`); // TODO TEMP!!!
      }
      break;

    case EndPoints[4]: // /etccorp/pboc/api/v1/invoices
      if (!noQueryParam) {
        logger.info(`Received '${url.url}' with query string: '${JSON.stringify(url.query)}': '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else if (!isJsonPayload) {
        logger.info(`Received '${url.url}' with non-JSON payload (${contentType}): '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else if (!isPost && !isPut) {
        logger.info(`Received '${url.url}' with unsupported (${method}) action: '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else {
        logger.info(`${isPost ? 'Create' : 'Update'} Invoice with ${attachmentInfo ? attachmentInfo : 'no attachment'}: '${JSON.stringify(jsonObj, null, ' ')}'`); // TODO TEMP!!!
      }
      break;

    case EndPoints[5]: // /etccorp/pboc/api/v1/invoices/notify
      if (!noQueryParam) {
        logger.info(`Received '${url.url}' with query string: '${JSON.stringify(url.query)}': '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else if (!isJsonPayload) {
        logger.info(`Received '${url.url}' with non-JSON payload (${contentType}): '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else if (!isPost) {
        logger.info(`Received '${url.url}' with unsupported (${method}) action: '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else {
        logger.info(`Notify Invoice with ${attachmentInfo ? attachmentInfo : 'no attachment'}: '${JSON.stringify(jsonObj, null, ' ')}'`); // TODO TEMP!!!
      }
      break;

    case EndPoints[6]: // /etccorp/pboc/api/v1/invoices/image/upload
      if (!noQueryParam) {
        logger.info(`Received '${url.url}' with query string: '${JSON.stringify(url.query)}': '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else if (!isFileUpload) {
        logger.info(`Received '${url.url}' without any attachment: '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else if (!isPost) {
        logger.info(`Received '${url.url}' with unsupported (${method}) action: '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else {
        logger.info(`Image ${attachmentInfo} uploaded: ${JSON.stringify(jsonDat, null, ' ')}`); // TODO TEMP!!!
      }
      break;

    case EndPoints[7]: // /invoice/result
      if (!noQueryParam) {
        logger.info(`Received '${url.url}' with query string: '${JSON.stringify(url.query)}': '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else if (!isJsonPayload) {
        logger.info(`Received '${url.url}' with non-JSON payload (${contentType}): '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else if (!isPost) {
        logger.info(`Received '${url.url}' with unsupported (${method}) action: '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else {
        logger.info(`Confirmed invoices: '${JSON.stringify(jsonObj, null, ' ')}'`); // TODO TEMP!!!
      }
      break;

    case EndPoints[8]: // /trade-financing/invresult
      if (!noQueryParam) {
        logger.info(`Received '${url.url}' with query string: '${JSON.stringify(url.query)}': '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else if (!isJsonPayload) {
        logger.info(`Received '${url.url}' with non-JSON payload (${contentType}): '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else if (!isPost) {
        logger.info(`Received '${url.url}' with unsupported (${method}) action: '${JSON.stringify(message)}'`); // TODO TEMP!!!
      } else {
        logger.info(`Notify payment status: '${JSON.stringify(jsonObj, null, ' ')}'`); // TODO TEMP!!!
      }
      break;

    default:
      logger.info(`Unhandled message '${JSON.stringify(message)}'`);
      break;
  }
};