import { Action, Store } from 'redux';
import type { Logger } from 'winston';

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
) => (args: TArg) => Promise<any>;
