import { getAction, getErrorAction, getSuccessAction } from '@fabric-es/fabric-cqrs';
import type { MergeEntityAction, MergeEntityBatchAction } from './types';

const MERGE_ENTITY = '[Project] Merge Entity';
const MERGE_ENTITY_ERROR = '[Project] Merge Entity Error';
const MERGE_ENTITY_SUCCESS = '[Project] Merge Entity Success';
const MERGE_ENTITY_BATCH = '[Project] Merge Entity Batch';
const MERGE_ENTITY_BATCH_ERROR = '[Project] Merge Entity Batch Error';
const MERGE_ENTITY_BATCH_SUCCESS = '[Project] Merge Entity Batch Success';

export const action = {
  MERGE_ENTITY,
  MERGE_ENTITY_SUCCESS,
  MERGE_ENTITY_ERROR,
  MERGE_ENTITY_BATCH,
  MERGE_ENTITY_BATCH_SUCCESS,
  MERGE_ENTITY_BATCH_ERROR,
  mergeEntity: getAction<MergeEntityAction>(MERGE_ENTITY),
  mergeEntitySuccess: getSuccessAction(MERGE_ENTITY_SUCCESS),
  mergeEntityError: getErrorAction(MERGE_ENTITY_ERROR),
  mergeEntityBatch: getAction<MergeEntityBatchAction>(MERGE_ENTITY_BATCH),
  mergeEntityBatchError: getErrorAction(MERGE_ENTITY_BATCH_ERROR),
  mergeEntityBatchSuccess: getSuccessAction(MERGE_ENTITY_BATCH_SUCCESS),
};
