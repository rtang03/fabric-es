export interface ReqRes {
  id: string;
  startTime: number;
  duration: number;
  method: string;
  url: Object;
  reqBody: Object;
  statusCode: number;
  statusMessage: string;
};