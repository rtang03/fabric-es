export type QueryDatabaseResponse<TResult = any> = {
  status: string;
  message: string;
  result?: TResult;
  error?: any;
};
