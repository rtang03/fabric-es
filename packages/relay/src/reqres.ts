import querystring from 'query-string';

export interface ReqRes {
  id: string;
  startTime: number;
  duration: number;
  method: string;
  url: querystring.ParsedUrl;
  contentType: string;
  reqBody: any;
  resBody: any;
  attachmentInfo: any;
  statusCode: number;
  statusMessage: string;
};

// Type guard
export const isReqRes = (variable: any): variable is ReqRes => {
  const val = variable as ReqRes;
  return (val.id !== undefined) &&
    (val.startTime !== undefined) &&
    (val.duration !== undefined) &&
    (val.method !== undefined) &&
    (val.url !== undefined) &&
    (val.statusCode !== undefined) &&
    (val.statusMessage !== undefined);
};