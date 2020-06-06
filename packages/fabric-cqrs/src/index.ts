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
export { createQueryDatabase, createQueryHandler } from './queryHandler';
export { createRepository, createPrivateRepository } from './repository';

// export { fromCommitsToGroupByEntityId, getHistory, isCommit } from './peer/utils';
