/**
 * @packageDocumentation
 * @hidden
 */
import { getAction, getSuccessAction } from '../utils';
import { FindAction, UpsertAction, UpsertManyAction } from './types';

const UPSERT = '[Project] Upsert Entity';
const UPSERT_SUCCESS = '[Project] Upsert Entity Success';
const UPSERT_MANY = '[Project] Upsert Many Entity';
const UPSERT_MANY_SUCCESS = '[Project] Upsert Many Success';
const FIND = '[Project] Find';
const FIND_SUCCESS = '[Project] Find Success';

export const action = {
  UPSERT: MERGE,
  UPSERT_SUCCESS: MERGE_ENTITY_SUCCESS,
  UPSERT_MANY: MERGE_ENTITY_BATCH,
  UPSERT_MANY_SUCCESS: MERGE_ENTITY_BATCH_SUCCESS,
  FIND: MERGE_ENTITY_ERROR,
  FIND_SUCCESS: MERGE_ENTITY_BATCH_ERROR,
  find: getAction<FindAction>(FIND),
  upsert: getAction<UpsertAction>(UPSERT),
  mergeEntityBatch: getAction<UpsertManyAction>(UPSERT_MANY),
  mergeEntityBatchError: getSuccessAction(FIND_SUCCESS),
  mergeEntitySuccess: getSuccessAction(UPSERT_SUCCESS),
  mergeEntityBatchSuccess: getSuccessAction(UPSERT_MANY_SUCCESS)
};
