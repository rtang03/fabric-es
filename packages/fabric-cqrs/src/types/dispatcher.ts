import { Action, Store } from 'redux';
import type { Logger } from 'winston';
import { HandlerResponse } from './queryHandler';

/**
 * @ignore
 */
export type DispatcherOptions = {
  name: string;
  store: Store;
  slice: string;
  SuccessAction: string;
  ErrorAction?: string;
  logger: Logger;
  typeGuard?: (input: any) => boolean;
};

/**
 * @ignore
 */
export type Dispatcher = <TResult, TArg>(
  actionDispatcher: (payload: any) => Action,
  options: DispatcherOptions,
  onSuccess?: (result: any) => TResult
) => (args?: TArg) => Promise<HandlerResponse<TResult>>;
