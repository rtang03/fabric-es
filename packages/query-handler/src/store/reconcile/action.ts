import { getAction, getErrorAction, getSuccessAction } from '@fabric-es/fabric-cqrs';
import { MergeCommitBatchAction, ReconcileAction } from './types';

const RECONCILE = '[Entity] Reconcile';
const RECONCILE_ERROR = '[Entity] Reconcile Error';
const RECONCILE_SUCCESS = '[Entity] Reconcile Success';
const MERGE_COMMIT_BATCH = '[Entity] Merge commits';
const MERGE_COMMIT_BATCH_SUCCESS = '[Entity] Merge commits Success';
const MERGE_COMMIT_BATCH_ERROR = '[Entity] Merge commits Error';
const MERGE_ENTITY_BATCH = '[Entity] Merge commits into entity';
const MERGE_ENTITY_BATCH_SUCCESS = '[Entity] Merge commits into entity Success';
const MERGE_ENTITY_BATCH_ERROR = '[Entity] Merge commits into entity Error';

export const action = {
  RECONCILE,
  RECONCILE_ERROR,
  RECONCILE_SUCCESS,
  MERGE_COMMIT_BATCH,
  MERGE_ENTITY_BATCH,
  MERGE_COMMIT_BATCH_SUCCESS,
  MERGE_COMMIT_BATCH_ERROR,
  MERGE_ENTITY_BATCH_SUCCESS,
  MERGE_ENTITY_BATCH_ERROR,
  reconcile: getAction<ReconcileAction>(RECONCILE),
  reconcileError: getErrorAction(RECONCILE_ERROR),
  reconcileSuccess: getSuccessAction(RECONCILE_SUCCESS),
  mergeCommitBatch: getAction<MergeCommitBatchAction>(MERGE_COMMIT_BATCH),
  mergeCommitBatchError: getErrorAction(MERGE_COMMIT_BATCH_ERROR),
  mergeCommitBatchSuccess: getSuccessAction(MERGE_COMMIT_BATCH_SUCCESS),
  mergeEntityBatch: getAction<MergeCommitBatchAction>(MERGE_ENTITY_BATCH),
  mergeEntityBatchError: getErrorAction(MERGE_ENTITY_BATCH_ERROR),
  mergeEntityBatchSuccess: getSuccessAction(MERGE_ENTITY_BATCH_SUCCESS),
};
