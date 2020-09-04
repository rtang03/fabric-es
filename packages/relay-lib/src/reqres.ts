import querystring from 'query-string';

export interface ReqRes {
  id: string;
  proxyReqStarts: number;
  proxyReqFinish: number;
  proxyResStarts: number;
  proxyResFinish: number;
  method: string;
  url: querystring.ParsedUrl;
  contentType: string;
  reqBody: any;
  resBody: any;
  attachmentInfo: string;
  statusCode: number;
  statusMessage: string;
};

// Type guard
export const isReqRes = (variable: any): variable is ReqRes => {
  const val = variable as ReqRes;
  return (val.id !== undefined) &&
    (val.proxyReqStarts !== undefined) &&
    (val.proxyResStarts !== undefined) &&
    (val.method !== undefined) &&
    (val.url !== undefined) &&
    (val.statusCode !== undefined) &&
    (val.statusMessage !== undefined);
};