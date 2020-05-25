export interface ReqRes {
  id: string;
  startTime: number;
  duration: number;
  method: string;
  url: string;
  reqbody: string;
  statusCode: number;
  statusMessage: string;
};