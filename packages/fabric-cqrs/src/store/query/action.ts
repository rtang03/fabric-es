import { getAction, getErrorAction, getSuccessAction } from '../utils';
import type {
  DeleteByEntityIdAction,
  DeleteByEntityNameAction,
  MergeAction,
  MergeBatchAction,
  QueryByEntityIdAction,
  QueryByEntityNameAction,
  EIdxSearchAction,
  CIdxSearchAction,
} from './types';

const DELETE_BY_ENTITYNAME = '[Query-Db] Delete entities by EntityName';
const DELETE_BY_ENTITY_ID = '[Query-Db] Delete entities by entityId';
const DELETE_ERROR = '[Query-Db] Delete Error';
const DELETE_SUCCESS = '[Query-Db] Delete Success';
const QUERY_BY_ENTITYNAME = '[Query-Db] Query entities By EntityName';
const QUERY_BY_ENTITY_ID = '[Query-Db] Query entities By entityId';
const QUERY_ERROR = '[Query-Db] Query Error';
const QUERY_SUCCESS = '[Query-Db] Query Success';
const MERGE_COMMIT = '[Query-Db] Merge commit';
const MERGE_COMMIT_ERROR = '[Query-Db] Merge Error';
const MERGE_COMMIT_SUCCESS = '[Query-Db] Merge Success';
const MERGE_COMMIT_BATCH = '[Query-Db] Merge records of entities';
const MERGE_COMMIT_BATCH_ERROR = '[Query-Db] Merge Batch Error';
const MERGE_COMMIT_BATCH_SUCCESS = '[Query-Db] Merge Batch Success';
const CIDX_SEARCH = '[Query-Db] cidx Search';
const EIDX_SEARCH = '[Query-Db] eidx Search';
const SEARCH_SUCCESS = '[Query-Db] Search Success';
const SEARCH_ERROR = '[Query-Db] Search Error';

export const action = {
  DELETE_BY_ENTITYNAME,
  DELETE_BY_ENTITY_ID,
  DELETE_ERROR,
  DELETE_SUCCESS,
  QUERY_BY_ENTITYNAME,
  QUERY_BY_ENTITY_ID,
  QUERY_ERROR,
  QUERY_SUCCESS,
  MERGE_COMMIT,
  MERGE_COMMIT_ERROR,
  MERGE_COMMIT_SUCCESS,
  MERGE_COMMIT_BATCH,
  MERGE_COMMIT_BATCH_ERROR,
  MERGE_COMMIT_BATCH_SUCCESS,
  CIDX_SEARCH,
  EIDX_SEARCH,
  SEARCH_SUCCESS,
  SEARCH_ERROR,
  deleteByEntityId: getAction<DeleteByEntityIdAction>(DELETE_BY_ENTITY_ID),
  deleteByEntityName: getAction<DeleteByEntityNameAction>(DELETE_BY_ENTITYNAME),
  mergeCommit: getAction<MergeAction>(MERGE_COMMIT),
  mergeCommitBatch: getAction<MergeBatchAction>(MERGE_COMMIT_BATCH),
  queryByEntityName: getAction<QueryByEntityNameAction>(QUERY_BY_ENTITYNAME),
  queryByEntityId: getAction<QueryByEntityIdAction>(QUERY_BY_ENTITY_ID),
  deleteError: getErrorAction(DELETE_ERROR),
  deleteSuccess: getSuccessAction(DELETE_SUCCESS),
  queryError: getErrorAction(QUERY_ERROR),
  querySuccess: getSuccessAction(QUERY_SUCCESS),
  mergeCommitError: getErrorAction(MERGE_COMMIT_ERROR),
  mergeCommitSuccess: getSuccessAction(MERGE_COMMIT_SUCCESS),
  mergeCommitBatchError: getErrorAction(MERGE_COMMIT_BATCH_ERROR),
  mergeCommitBatchSuccess: getSuccessAction(MERGE_COMMIT_BATCH_SUCCESS),
  cIdxSearch: getAction<CIdxSearchAction>(CIDX_SEARCH),
  eIdxSearch: getAction<EIdxSearchAction>(EIDX_SEARCH),
  searchSuccess: getSuccessAction(SEARCH_SUCCESS),
  searchError: getErrorAction(SEARCH_ERROR),
};
