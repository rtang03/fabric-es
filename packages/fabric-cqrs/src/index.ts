/**
 * @packageDocumentation
 * @hidden
 */
import { createRedisRepository } from './queryHandler';

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
export * from './queryHandler/types';
export { isCommit, getHistory, getPaginated } from './utils';
export { createQueryDatabase, createRedisRepository, createQueryHandler } from './queryHandler';
export {
  createRepository,
  createPrivateRepository,
  getMockRepository,
  getPrivateMockRepository,
} from './repository';

import {
  OutputCounter,
  CounterCommands,
  Increment,
  Decrement,
  Counter,
  CounterEvent,
  CounterEvents,
  reducer as counterReducer,
  CounterInRedis,
  counterIndexDefinition,
  postSelector as counterPostSelector,
  preSelector as counterPreSelector,
} from './unit-test-counter';
export {
  CounterInRedis,
  counterPostSelector,
  counterPreSelector,
  counterIndexDefinition,
  OutputCounter,
  CounterCommands,
  Counter,
  counterReducer,
  CounterEvent,
  Increment,
  Decrement,
  CounterEvents,
};
