export type CommonResponse<TResult = any> = {
  status: 'OK' | 'ERROR';
  message?: string;
  result?: TResult;
  error?: Error[];
};
