export interface ReqRes {
  id: string;
  startTime: number;
  duration: number;
  method: string;
  url: any;
  reqBody: any;
  statusCode: number;
  statusMessage: string;
};