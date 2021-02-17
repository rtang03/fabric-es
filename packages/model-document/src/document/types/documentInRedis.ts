export type DocumentInRedis = {
  id: string;
  owner: string;
  loanId: string;
  title: string;
  status: string;
  ref: string;
  ts: number;
  created: number;
  creator: string;
};
