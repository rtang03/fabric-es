import {
  BaseEntity,
  Commit,
  PrivateRepository,
  Repository,
} from '@fabric-es/fabric-cqrs';
import { ProcessResults, ReqRes } from '@fabric-es/relay-lib';
import { invoiceCommandHandler, InvoiceRepo, InvKeys, InvOrderKeys } from './inv';
import { poCommandHandler, PoRepo, PoKeys, PoOrderKeys } from './po';

export * from './po';
export * from './inv';

export enum Status {
  New, Updated, Accepted, Rejected, Cancelled, Transferred
};

export class Attachment extends BaseEntity {
  name: string;
  type: string;
  desc?: string;
};

export const dsplit = (input: string, separator = ',', delimiter = '"'): string[] => {
  const regex1 = new RegExp(`${separator}?((?<!\\\\)${delimiter}.+?(?<!\\\\)${delimiter})${separator}?`); // Split quoted parts first
  const regex2 = new RegExp(`((?<!\\\\)${delimiter}|\\\\)+`, 'g');  // Remove quotes from quoted parts
  return input
    .split(regex1).filter(v => v)
    .reduce((a, c) => (c.includes(delimiter)) ? [...a, c.replace(regex2, '')] : [...a, ...c.split(separator)], []);
};

export const djoin = (input: string[], separator = ',', delimiter = '"'): string => {
  const regex = new RegExp(`${delimiter}`, 'g');
  return input.reduce((a, c) => {
    const delim = `\\${delimiter}`;
    const d = c.replace(regex, delim);
    const needDelimit = d.includes(separator) || (d.includes(delim) && !(d.startsWith(delim) && d.endsWith(delim)));
    return `${a ? `${a}${separator}` : ''}${needDelimit ? `${delimiter}${d}${delimiter}` : d}`;
  }, '');
};

export const buildTag = (current: string, values: Record<string, string>): string => {
  const otag: Record<string, string> = dsplit(current || '').reduce((a, c) => {
    const w = dsplit(c, ':');
    if (w.length === 2) return { ...a, [w[0]]: w[1] };
  }, {});

  const ntag: Record<string, string> = {
    ...otag,
    ...values
  };

  return djoin(Object.entries(ntag).map(r => djoin(r, ':')));
};

export const objFilter = (obj, keys) =>
  keys.reduce((a, c) => ({ ...a, [c]: obj[c] }), {});

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
      id, proxyReqStarts, proxyReqFinish, proxyResStarts, proxyResFinish, method, url, contentType, reqBody, resBody, attachmentInfo, statusCode, statusMessage
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
        if (attachmentInfo && (attachmentInfo !== '')) isFileUpload = true;

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

        if (!noQueryParam && url.query['jsonObj']) {
          // NOTE 2020-10-15
          // For work around with eTC sending jsonObj in query param instead of with the html form along with the file field
          try {
            jsonObj = JSON.parse(url.query['jsonObj'] as string);
            isRequestJson = true;
          } catch (error) {
            jsonObj = url.query['jsonObj'] as string;
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

    const parseAttachmentInfo = (): Attachment[] => {
      if (attachmentInfo) {
        try {
          const result = JSON.parse(attachmentInfo);
          if (Array.isArray(result))
            return result;
          else
            return [result];
        } catch (error) {
          return [{
            name: 'invalid',
            type: 'unknown',
            desc: attachmentInfo
          }];
        }
      } else {
        return [];
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
        // if (!noQueryParam) {
        //   result = buildError(`Received query string: '${JSON.stringify(url.query)}'`);
        if (!isRequestJson) {
          result = buildError(`Received non-JSON payload (${contentType})`);
        } else if (!isPost && !isPut) {
          result = buildError(`Received unsupported (${method}) action`);
        } else if (!isStatusOkay) {
          result = buildError(`${isPost ? 'Create' : 'Update'} PO failed`); // TODO - support partial success? 'No' according to Jason Lu 20200814
        } else {
          const payloads = Array.isArray(jsonObj) ? jsonObj.map(obj => ({
            userId: enrollmentId,
            timestamp: Date.now(),
            ...objFilter(obj.poBaseInfo, PoKeys),
            orderList: obj.orderList.map(l => objFilter(l, PoOrderKeys)),
            // attachmentList: parseAttachmentInfo()
          })) : [{
            userId: enrollmentId,
            timestamp: Date.now(),
            ...objFilter(jsonObj.poBaseInfo, PoKeys),
            orderList: jsonObj.orderList.map(l => objFilter(l, PoOrderKeys)),
            // attachmentList: parseAttachmentInfo()
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

      case EndPoints[2]: // /order/cancelPO
        // if (!noQueryParam) {
        //   result = buildError(`Received query string: '${JSON.stringify(url.query)}'`);
        if (!isRequestJson) {
          result = buildError(`Received non-JSON payload (${contentType})`);
        } else if (!isPost) {
          result = buildError(`Received unsupported (${method}) action`);
        } else if (!isStatusOkay) {
          result = buildError('Cancel PO failed'); // TODO - support partial success? 'No' according to Jason Lu 20200814
        } else {
          const payloads = Array.isArray(jsonObj) ? jsonObj.map(obj => ({
            userId: enrollmentId,
            timestamp: Date.now(),
            ...obj
          })) : [{
            userId: enrollmentId,
            timestamp: Date.now(),
            ...jsonObj
          }];
          result = buildResult('PoCancelled',
            await Promise.all(payloads.map(payload => 
              poCommandHandler({ enrollmentId, poRepo: repositories['po'] as PoRepo }).CancelPo({ payload })
            )));
        }
        break;

      case EndPoints[3]: // /etccorp/pboc/api/v1/po/process
        if (!noQueryParam) {
          result = buildError(`Received query string: '${JSON.stringify(url.query)}'`);
        } else if (!isRequestJson) {
          result = buildError(`Received non-JSON payload (${contentType})`);
        } else if (!isPost) {
          result = buildError(`Received unsupported (${method}) action`);
        } else if (!isStatusOkay) {
          result = buildError('Process PO failed'); // TODO - support partial success? 'No' according to Jason Lu 20200814
        } else {
          const payloads = Array.isArray(jsonObj) ? jsonObj.map(obj => ({
            userId: enrollmentId,
            timestamp: Date.now(),
            ...obj
          })) : [{
            userId: enrollmentId,
            timestamp: Date.now(),
            ...jsonObj
          }];
          result = buildResult('PoProcessed',
            await Promise.all(payloads.map(payload => 
              poCommandHandler({ enrollmentId, poRepo: repositories['po'] as PoRepo }).ProcessPo({ payload })
            )));
        }
        break;

      case EndPoints[4]: // /etccorp/pboc/api/v1/invoices
        if (!noQueryParam) {
          result = buildError(`Received query string: '${JSON.stringify(url.query)}'`);
        } else if (!isRequestJson) {
          result = buildError(`Received non-JSON payload (${contentType})`);
        } else if (!isPost && !isPut) {
          result = buildError(`Received unsupported (${method}) action`);
        } else if (!isStatusOkay) {
          result = buildError(`${isPost ? 'Create' : 'Update'} Invoice failed`); // OK here, no partial success
        } else {
          const payloads = Array.isArray(jsonObj) ? jsonObj.map(obj => ({
            userId: enrollmentId,
            timestamp: Date.now(),
            ...objFilter(obj.invBaseInfo, InvKeys),
            orderList: obj.orderList.map(l => objFilter(l, InvOrderKeys)),
            // attachmentList: parseAttachmentInfo()
          })) : [{
            userId: enrollmentId,
            timestamp: Date.now(),
            ...objFilter(jsonObj.invBaseInfo, InvKeys),
            orderList: jsonObj.orderList.map(l => objFilter(l, InvOrderKeys)),
            // attachmentList: parseAttachmentInfo()
          }];

          const commits = (isPost) ?
            await Promise.all(payloads.map(payload => 
              invoiceCommandHandler({ enrollmentId, invoiceRepo: repositories['invoice'] as InvoiceRepo }).CreateInvoice({ payload })
            )) :
            await Promise.all(payloads.map(payload => 
              invoiceCommandHandler({ enrollmentId, invoiceRepo: repositories['invoice'] as InvoiceRepo }).UpdateInvoice({ payload })
            ));
          result = buildResult(`Invoice${isPost ? 'Created' : 'Updated'}`, commits);
        }
        break;

      case EndPoints[5]: // /etccorp/pboc/api/v1/invoices/notify
        if (!noQueryParam) {
          result = buildError(`Received query string: '${JSON.stringify(url.query)}'`);
        } else if (!isRequestJson) {
          result = buildError(`Received non-JSON payload (${contentType})`);
        } else if (!isPost) {
          result = buildError(`Received unsupported (${method}) action`);
        } else if (!isStatusOkay) {
          result = buildError('Invoice transfer failed'); // OK here, no partial success
        } else {
          const convertPayload = (obj) => {
            const result = [];
            for (const item of obj.invoices) {
              result.push({
                ...item,
                // financeNo: obj.financeNo,
                poId: obj.poId
              });
            }
            return result;
          };

          let payloads;
          if (Array.isArray(jsonObj)) {
            payloads = [];
            for (const obj of jsonObj) {
              payloads.push(...convertPayload(obj).map(c => ({
                userId: enrollmentId,
                timestamp: Date.now(),
                ...c
              })));
            }
          } else {
            payloads = convertPayload(jsonObj).map(c => ({
              userId: enrollmentId,
              timestamp: Date.now(),
              ...c
            }));
          }

          result = buildResult('InvoiceTransferred',
            await Promise.all(payloads.map(payload => 
              invoiceCommandHandler({ enrollmentId, invoiceRepo: repositories['invoice'] as InvoiceRepo }).TransferInvoice({ payload })
            )));
        }
        break;

      case EndPoints[6]: // /etccorp/pboc/api/v1/invoices/image/upload
        if (!isFileUpload) {
          result = buildError('No file uploaded');
        } else if (!isPost) {
          result = buildError(`Received unsupported (${method}) action`);
        } else if (!isStatusOkay) {
          result = buildError('Invoice image upload failed'); // OK here, batch mode not supported
        } else if (noQueryParam) {
          result = buildError('Missing query paramters');
        } else if ((Object.keys(jsonReq).length <= 0) && (jsonReq.constructor === Object)) {
          if (Array.isArray(url.query.imageDesc) || Array.isArray(url.query.invoiceId)) {
            result = buildError('Invalid query paramter format');
          } else {
            // const attachmentList = parseAttachmentInfo();
            // const descs = url.query.imageDesc.split('_');
            // if (descs.length === attachmentList.length) {
            //   for (let i = 0; i < attachmentList.length; i ++) {
            //     attachmentList[i].desc = descs[i];
            //   }
            // } else {
            //   for (const attch of attachmentList) {
            //     attch.desc = url.query.imageDesc;
            //   }
            // }
            const payload = {
              userId: enrollmentId,
              timestamp: Date.now(),
              invoiceId: url.query.invoiceId,
              // attachmentList
            };
            result = buildResult('InvoiceImageUploaded',
              [await invoiceCommandHandler({ enrollmentId, invoiceRepo: repositories['invoice'] as InvoiceRepo }).UploadInvoiceImage({
                payload
              })]);
          }
        } else {
          result = buildError(`Request body not empty: ${JSON.stringify(jsonObj)}`);
        }
        break;

      case EndPoints[7]: // /invoice/result
        if (!noQueryParam) {
          result = buildError(`Received query string: '${JSON.stringify(url.query)}'`);
        } else if (!isRequestJson) {
          result = buildError(`Received non-JSON payload (${contentType})`);
        } else if (!isPost) {
          result = buildError(`Received unsupported (${method}) action`);
        } else if (!isStatusOkay) {
          result = buildError('Invoice response failed'); // OK here, no partial success
        } else {
          const payloads = Array.isArray(jsonObj) ? jsonObj.map(obj => ({
            userId: enrollmentId,
            timestamp: Date.now(),
            ...obj
          })) : [{
            userId: enrollmentId,
            timestamp: Date.now(),
            ...jsonObj
          }];
          result = buildResult('InvoiceConfirmed',
            await Promise.all(payloads.map(payload => 
              invoiceCommandHandler({ enrollmentId, invoiceRepo: repositories['invoice'] as InvoiceRepo }).ConfirmInvoice({ payload })
            )));
        }
        break;

      case EndPoints[8]: // /trade-financing/invresult
        if (!noQueryParam) {
          result = buildError(`Received query string: '${JSON.stringify(url.query)}'`);
        } else if (!isRequestJson) {
          result = buildError(`Received non-JSON payload (${contentType})`);
        } else if (!isPost) {
          result = buildError(`Received unsupported (${method}) action`);
        } else if (!isStatusOkay) {
          result = buildError('Notify payment status failed'); // TODO - support partial success, but how?
        } else {
          const payloads = Array.isArray(jsonObj) ? jsonObj.map(obj => ({
            userId: enrollmentId,
            timestamp: Date.now(),
            ...obj
          })) : [{
            userId: enrollmentId,
            timestamp: Date.now(),
            ...jsonObj
          }];
          result = buildResult('PaymentStatusUpdated',
            await Promise.all(payloads.map(payload => 
              invoiceCommandHandler({ enrollmentId, invoiceRepo: repositories['invoice'] as InvoiceRepo }).UpdatePaymentStatus({ payload })
            )));
        }
        break;

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