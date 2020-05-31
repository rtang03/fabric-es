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
  UPSERT,
  UPSERT_SUCCESS,
  UPSERT_MANY,
  UPSERT_MANY_SUCCESS,
  FIND,
  FIND_SUCCESS,
  find: getAction<FindAction>(FIND),
  upsert: getAction<UpsertAction>(UPSERT),
  mergeEntityBatch: getAction<UpsertManyAction>(UPSERT_MANY),
  mergeEntityBatchError: getSuccessAction(FIND_SUCCESS),
  mergeEntitySuccess: getSuccessAction(UPSERT_SUCCESS),
  mergeEntityBatchSuccess: getSuccessAction(UPSERT_MANY_SUCCESS)
};
