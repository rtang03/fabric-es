/**
 * @packageDocumentation
 * @hidden
 */
export {
  getContract,
  getNetwork,
  submit,
  submit$,
  submitPrivateData,
  submitPrivateData$,
  evaluate,
  evaluate$,
} from './services';
export * from './types';
export { isCommit, getHistory } from './utils';
export { commitIndex, entityIndex, createQueryDatabase, createQueryHandler } from './queryHandler';
export {
  createRepository,
  createPrivateRepository,
  getMockRepository,
  getPrivateMockRepository,
} from './repository';

import {
  CounterCommands,
  Increment,
  Decrement,
  Counter,
  CounterEvent,
  CounterEvents,
  reducer as counterReducer,
} from './unit-test-reducer';
export {
  CounterCommands,
  Counter,
  counterReducer,
  CounterEvent,
  Increment,
  Decrement,
  CounterEvents,
};
