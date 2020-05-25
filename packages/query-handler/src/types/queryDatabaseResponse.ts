export interface QueryDatabaseResponse<TResult = any> {
  status: string;
  message: string;
  result?: TResult;
}
