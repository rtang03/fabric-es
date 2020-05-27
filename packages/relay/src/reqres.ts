export interface ReqRes {
  id: string;
  startTime: number;
  duration: number;
  method: string;
  url: string;
  reqBody: string;
  statusCode: number;
  statusMessage: string;
};