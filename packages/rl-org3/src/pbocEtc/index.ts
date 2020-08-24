import {
  BaseEntity,
  Commit,
  PrivateRepository,
  Repository,
} from '@fabric-es/fabric-cqrs';
import { getLogger } from '@fabric-es/gateway-lib';
import { ProcessResults, ReqRes } from '@fabric-es/relay-lib';
import { poCommandHandler, PoRepo } from './po';

const logger = getLogger('[sniffer] pbocEtc.js');

export * from './po';
export * from './inv';

export enum Status {
  New, Updated, Accepted, Rejected, Cancelled
};

export class Attachment extends BaseEntity {
  static entityName: 'attachment';

  id: string;
  name: string;
  type: string;
};

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

export const getPbocEtcEntityProcessor = (enrollmentId: string, repositories: Record<string, Repository | PrivateRepository>) => {
  return async (message: ReqRes): Promise<ProcessResults> => {
    const {
      id, startTime, duration, method, url, contentType, reqBody, resBody, attachmentInfo, statusCode, statusMessage
    } = message;

    const noQueryParam = (Object.keys(url.query).length <= 0) && (url.query.constructor === Object);
    const isPost = method === 'POST';
    const isPut = method === 'PUT';
    const isGet = method === 'GET';
    const isStatusOkay = (statusCode >= 200) && (statusCode < 300);

    let isFileUpload = false;
    let isRequestJson = false;
    let jsonObj;
    let jsonReq;
    let jsonRes;

    if (contentType) {
      if (contentType === 'multipart/form-data') {
        if (attachmentInfo && (attachmentInfo.name !== '')) isFileUpload = true;

        try {
          jsonReq = JSON.parse(reqBody);
        } catch (error) {
          jsonReq = reqBody;
        }

        if (jsonReq['jsonObj']) {
          try {
            jsonObj = JSON.parse(jsonReq['jsonObj']);
            isRequestJson = true;
          } catch (error) {
            jsonObj = jsonReq['jsonObj'];
          }
        }
      } else if (contentType === 'application/json') {
        try {
          jsonObj = JSON.parse(reqBody);
          isRequestJson = true;
        } catch (error) {
          jsonObj = reqBody; // this should not happen...
        }
      }
    }

    if (!isStatusOkay) {
      try {
        jsonRes = JSON.parse(resBody);
      } catch (error) {}
    }

    const parseAttachmentInfo = () => {
      try {
        return JSON.parse(attachmentInfo);
      } catch (error) {
        return attachmentInfo;
      }
    };

    const buildError = (...errors: string[]): ProcessResults => {
      return {
        endPoint: url.url,
        method,
        statusCode,
        statusMessage,
        errors,
        reqBody,
        resBody
      };
    };

    const buildResult = (type: string, commits: Commit[]): ProcessResults => {
      return {
        endPoint: url.url,
        method,
        statusCode,
        statusMessage,
        commits,
        reqBody,
        resBody
      };
    };

    let result: ProcessResults;

    switch (url.url) {
      case EndPoints[1]: // /order/po
        if (!noQueryParam) {
          result = buildError(`Received query string: '${JSON.stringify(url.query)}'`);
        } else if (!isRequestJson) {
          result = buildError(`Received non-JSON payload (${contentType})`);
        } else if (!isPost && !isPut) {
          result = buildError(`Received unsupported (${method}) action`);
        } else if (!isStatusOkay) {
          result = buildError(`${isPost ? 'Create' : 'Update'} PO failed`); // TODO - support partial success? 'No' according to Jason Lu 20200814
        } else {
          // result = buildEvent(`Po${isPost ? 'Created' : 'Updated'}`, jsonObj);
          const payloads = Array.isArray(jsonObj) ? jsonObj.map(obj => ({
            userId: enrollmentId,
            timestamp: Date.now(),
            ...obj.poBaseInfo,
            orderList: obj.orderList,
            attachmentList: parseAttachmentInfo()
          })) : [{
            userId: enrollmentId,
            timestamp: Date.now(),
            ...jsonObj.poBaseInfo,
            orderList: jsonObj.orderList,
            attachmentList: parseAttachmentInfo()
          }];

          const commits = (isPost) ?
            await Promise.all(payloads.map(payload => 
              poCommandHandler({ enrollmentId, poRepo: repositories['po'] as PoRepo }).CreatePo({ payload })
            )) :
            await Promise.all(payloads.map(payload => 
              poCommandHandler({ enrollmentId, poRepo: repositories['po'] as PoRepo }).UpdatePo({ payload })
            ));
          result = buildResult(`Po${isPost ? 'Created' : 'Updated'}`, commits);
        }
        break;

      // case EndPoints[2]: // /order/cancelPO
      //   if (!noQueryParam) {
      //     result = buildError(`Received query string: '${JSON.stringify(url.query)}'`);
      //   } else if (!isRequestJson) {
      //     result = buildError(`Received non-JSON payload (${contentType})`);
      //   } else if (!isPost) {
      //     result = buildError(`Received unsupported (${method}) action`);
      //   } else if (!isStatusOkay) {
      //     result = buildError('Cancel PO failed'); // TODO - support partial success? 'No' according to Jason Lu 20200814
      //   } else {
      //     result = buildEvent('PoCancelled', jsonObj);
      //   }
      //   break;

      // case EndPoints[3]: // /etccorp/pboc/api/v1/po/process
      //   if (!noQueryParam) {
      //     result = buildError(`Received query string: '${JSON.stringify(url.query)}'`);
      //   } else if (!isRequestJson) {
      //     result = buildError(`Received non-JSON payload (${contentType})`);
      //   } else if (!isPost) {
      //     result = buildError(`Received unsupported (${method}) action`);
      //   } else if (!isStatusOkay) {
      //     result = buildError('Process PO failed'); // TODO - support partial success? 'No' according to Jason Lu 20200814
      //   } else {
      //     result = buildEvent('PoProcessed', jsonObj);
      //   }
      //   break;

      // case EndPoints[4]: // /etccorp/pboc/api/v1/invoices
      //   if (!noQueryParam) {
      //     result = buildError(`Received query string: '${JSON.stringify(url.query)}'`);
      //   } else if (!isRequestJson) {
      //     result = buildError(`Received non-JSON payload (${contentType})`);
      //   } else if (!isPost && !isPut) {
      //     result = buildError(`Received unsupported (${method}) action`);
      //   } else if (!isStatusOkay) {
      //     result = buildError(`${isPost ? 'Create' : 'Update'} Invoice failed`); // OK here, no partial success
      //   } else {
      //     result = buildEvent(`Invoice${isPost ? 'Created' : 'Updated'}`, jsonObj);
      //   }
      //   break;

      // case EndPoints[5]: // /etccorp/pboc/api/v1/invoices/notify
      //   if (!noQueryParam) {
      //     result = buildError(`Received query string: '${JSON.stringify(url.query)}'`);
      //   } else if (!isRequestJson) {
      //     result = buildError(`Received non-JSON payload (${contentType})`);
      //   } else if (!isPost) {
      //     result = buildError(`Received unsupported (${method}) action`);
      //   } else if (!isStatusOkay) {
      //     logger.info('Notification failed'); // OK here, no partial success
      //   } else {
      //     result = buildEvent('InvoiceNotified', jsonObj);
      //   }
      //   break;

      // case EndPoints[6]: // /etccorp/pboc/api/v1/invoices/image/upload
      //   if (!isFileUpload) {
      //     result = buildError('No file uploaded');
      //   } else if (!isPost) {
      //     result = buildError(`Received unsupported (${method}) action`);
      //   } else if (!isStatusOkay) {
      //     result = buildError('Invoice image upload failed'); // OK here, batch mode not supported
      //   } else {
      //     if ((Object.keys(jsonReq).length <= 0) && (jsonReq.constructor === Object)) {
      //       if (!noQueryParam) result = buildEvent('InvoiceImageUploaded', url.query);
      //     } else {
      //       result = buildEvent('InvoiceImageUploaded', jsonReq);
      //     }
      //   }
      //   break;

      // case EndPoints[7]: // /invoice/result
      //   if (!noQueryParam) {
      //     result = buildError(`Received query string: '${JSON.stringify(url.query)}'`);
      //   } else if (!isRequestJson) {
      //     result = buildError(`Received non-JSON payload (${contentType})`);
      //   } else if (!isPost) {
      //     result = buildError(`Received unsupported (${method}) action`);
      //   } else if (!isStatusOkay) {
      //     result = buildError('Invoice response failed'); // OK here, no partial success
      //   } else {
      //     result = buildEvent('InvoiceResponded', jsonObj);
      //   }
      //   break;

      // case EndPoints[8]: // /trade-financing/invresult
      //   if (!noQueryParam) {
      //     result = buildError(`Received query string: '${JSON.stringify(url.query)}'`);
      //   } else if (!isRequestJson) {
      //     result = buildError(`Received non-JSON payload (${contentType})`);
      //   } else if (!isPost) {
      //     result = buildError(`Received unsupported (${method}) action`);
      //   } else if (!isStatusOkay) {
      //     result = buildError('Notify payment status failed'); // TODO - support partial success, but how?
      //   } else {
      //     result = buildEvent('PaymentStatusNotified', jsonObj);
      //   }
      //   break;

      default:
        result = buildError('Unknown end-point');
        break;
    }

    return new Promise<ProcessResults>((resolve, reject) => {
      if (result.errors)
        reject(result);
      else
        resolve(result);
    });
  };
};