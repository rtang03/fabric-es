import { Action, Store } from 'redux';
import { Logger } from 'winston';
import { QueryHandlerResponse } from './queryHandler';

export interface DispatcherOptions {
  name: string;
  store: Store;
  slice: string;
  SuccessAction: string;
  ErrorAction?: string;
  logger: Logger;
  typeGuard?: (input: any) => boolean;
}

export type Dispatcher = <TResult, TArg>(
  actionDispatcher: (payload: any) => Action,
  options: DispatcherOptions,
  onSuccess?: (result: any) => TResult
) => (args: TArg) => Promise<QueryHandlerResponse<TResult>>;
