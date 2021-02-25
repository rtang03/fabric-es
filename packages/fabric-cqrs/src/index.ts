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
  isOutputCounter,
  OutputCounter,
  CounterCommands,
  Increment,
  Decrement,
  Counter,
  CounterEvents,
  reducerCallback as counterReducerCallback,
  CounterInRedis,
  counterIndexDefinition,
  postSelector as counterPostSelector,
  preSelector as counterPreSelector,
} from './unit-test-counter';
export {
  isOutputCounter,
  CounterInRedis,
  counterPostSelector,
  counterPreSelector,
  counterIndexDefinition,
  OutputCounter,
  CounterCommands,
  Counter,
  counterReducerCallback,
  Increment,
  Decrement,
  CounterEvents,
};
