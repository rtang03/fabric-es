/**
 * @packageDocumentation
 * @hidden
 */
import { getAction, getErrorAction, getSuccessAction } from '../utils';
import {
  DeleteByEntityIdAction,
  DeleteByEntityNameAction,
  MergeAction,
  MergeBatchAction,
  QueryByEntityIdAction,
  QueryByEntityNameAction
} from './types';

const DELETE_BY_ENTITYNAME = '[Entity-Q] Delete entities by EntityName';
const DELETE_BY_ENTITY_ID = '[Entity-Q] Delete entities by entityId';
const DELETE_ERROR = '[Entity-Q] Delete Error';
const DELETE_SUCCESS = '[Entity-Q] Delete Success';
const QUERY_BY_ENTITYNAME = '[Entity-Q] Query entities By EntityName';
const QUERY_BY_ENTITY_ID = '[Entity-Q] Query entities By entityId';
const QUERY_ERROR = '[Entity-Q] Query Error';
const QUERY_SUCCESS = '[Entity-Q] Query Success';
const MERGE = '[Entity-Q] Merge entity';
const MERGE_ERROR = '[Entity-Q] Merge Error';
const MERGE_SUCCESS = '[Entity-Q] Merge Success';
const MERGE_BATCH = '[Entity-Q] Merge records of entities';
const MERGE_BATCH_ERROR = '[Entity-Q] Merge Batch Error';
const MERGE_BATCH_SUCCESS = '[Entity-Q] Merge Batch Success';

export const action = {
  DELETE_BY_ENTITYNAME,
  DELETE_BY_ENTITY_ID,
  DELETE_ERROR,
  DELETE_SUCCESS,
  QUERY_BY_ENTITYNAME,
  QUERY_BY_ENTITY_ID,
  QUERY_ERROR,
  QUERY_SUCCESS,
  MERGE,
  MERGE_ERROR,
  MERGE_SUCCESS,
  MERGE_BATCH,
  MERGE_BATCH_ERROR,
  MERGE_BATCH_SUCCESS,
  deleteByEntityId: getAction<DeleteByEntityIdAction>(DELETE_BY_ENTITY_ID),
  deleteByEntityName: getAction<DeleteByEntityNameAction>(DELETE_BY_ENTITYNAME),
  merge: getAction<MergeAction>(MERGE),
  mergeBatch: getAction<MergeBatchAction>(MERGE_BATCH),
  queryByEntityName: getAction<QueryByEntityNameAction>(QUERY_BY_ENTITYNAME),
  queryByEntityId: getAction<QueryByEntityIdAction>(QUERY_BY_ENTITY_ID),
  deleteError: getErrorAction(DELETE_ERROR),
  deleteSuccess: getSuccessAction(DELETE_SUCCESS),
  queryError: getErrorAction(QUERY_ERROR),
  querySuccess: getSuccessAction(QUERY_SUCCESS),
  mergeError: getErrorAction(MERGE_ERROR),
  mergeSuccess: getSuccessAction(MERGE_SUCCESS),
  mergeBatchError: getErrorAction(MERGE_BATCH_ERROR),
  mergeBatchSuccess: getSuccessAction(MERGE_BATCH_SUCCESS)
};
