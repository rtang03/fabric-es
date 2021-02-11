import { getAction, getErrorAction, getSuccessAction } from '../utils';
import type {
  DeleteCommitByEntityIdAction,
  DeleteCommitByEntityNameAction,
  MergeAction,
  MergeBatchAction,
  QueryByEntityIdAction,
  QueryByEntityNameAction,
  EIdxSearchAction,
  CIdxSearchAction,
  FindAction,
  NotifyAction,
  GetNotificationsAction,
  GetNotificationAction,
  ClearNotificationAction,
  ClearNotificationsAction,
  DeleteEntityByEntityNameAction,
} from './types';

const DELETE_COMMIT_BY_ENTITYNAME = '[Query-Db] Delete commits by EntityName';
const DELETE_COMMIT_BY_ENTITY_ID = '[Query-Db] Delete commits by entityId';
const DELETE_ERROR = '[Query-Db] Delete Error';
const DELETE_SUCCESS = '[Query-Db] Delete Success';
const QUERY_BY_ENTITYNAME = '[Query-Db] Query commits By EntityName';
const QUERY_BY_ENTITY_ID = '[Query-Db] Query commit By entityId';
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
const FIND = '[Query-Db] Find';
const FIND_SUCCESS = '[Query-Db] Find Success';
const FIND_ERROR = '[Query-Db] Find Error';
const NOTIFY = '[Query-Db] Notify';
const NOTIFY_SUCCESS = '[Query-Db] Notify Success';
const NOTIFY_ERROR = '[Query-Db] Notify Error';
const GET_NOTIFICATION = '[Query-Db] Get notification';
const GET_NOTIFICATIONS = '[Query-Db] Get notifications';
const GET_NOTI_SUCCESS = '[Query-Db] Get Notification / Notifications Success';
const GET_NOTI_ERROR = '[Query-Db] Get Notification / Notifications Error';
const CLEAR_NOTIFICATION = '[Query-Db] Clear notification';
const CLEAR_NOTIFICATIONS = '[Query-Db] Clear notifications';
const CLEAR_NOTI_SUCCESS = '[Query-Db] Clear Notification / Notifications Success';
const CLEAR_NOTI_ERROR = '[Query-Db] Clear Notification / Notifications Error';
const DELETE_ENTITY_BY_ENTITYNAME = '[Query-Db] Delete entity by EntityName';
const DELETE_ENTITY_SUCCESS = '[Query-Db] Delete entity by EntityName Success';
const DELETE_ENTITY_ERROR = '[Query-Db] Delete entity by EntityName Error';

export const action = {
  DELETE_COMMIT_BY_ENTITYNAME,
  DELETE_COMMIT_BY_ENTITY_ID,
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
  FIND,
  FIND_SUCCESS,
  FIND_ERROR,
  NOTIFY,
  NOTIFY_SUCCESS,
  NOTIFY_ERROR,
  GET_NOTIFICATION,
  GET_NOTIFICATIONS,
  GET_NOTI_SUCCESS,
  GET_NOTI_ERROR,
  CLEAR_NOTIFICATION,
  CLEAR_NOTIFICATIONS,
  CLEAR_NOTI_SUCCESS,
  CLEAR_NOTI_ERROR,
  DELETE_ENTITY_BY_ENTITYNAME,
  DELETE_ENTITY_SUCCESS,
  DELETE_ENTITY_ERROR,
  deleteCommitByEntityId: getAction<DeleteCommitByEntityIdAction>(DELETE_COMMIT_BY_ENTITY_ID),
  deleteCommitByEntityName: getAction<DeleteCommitByEntityNameAction>(DELETE_COMMIT_BY_ENTITYNAME),
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
  find: getAction<FindAction>(FIND),
  findSuccess: getSuccessAction(FIND_SUCCESS),
  findError: getErrorAction(FIND_ERROR),
  notify: getAction<NotifyAction>(NOTIFY),
  notifySuccess: getSuccessAction(NOTIFY_SUCCESS),
  notifyError: getErrorAction(NOTIFY_ERROR),
  getNotification: getAction<GetNotificationAction>(GET_NOTIFICATION),
  getNotifications: getAction<GetNotificationsAction>(GET_NOTIFICATIONS),
  getNotiSuccess: getSuccessAction(GET_NOTI_SUCCESS),
  getNotiError: getErrorAction(GET_NOTI_ERROR),
  clearNotification: getAction<ClearNotificationAction>(CLEAR_NOTIFICATION),
  clearNotifications: getAction<ClearNotificationsAction>(CLEAR_NOTIFICATIONS),
  clearNotiSuccess: getSuccessAction(CLEAR_NOTI_SUCCESS),
  clearNotiError: getErrorAction(CLEAR_NOTI_ERROR),
  deleteEntityByEntityName: getAction<DeleteEntityByEntityNameAction>(DELETE_ENTITY_BY_ENTITYNAME),
  deleteEntityByEntityNameSuccess: getSuccessAction(DELETE_ENTITY_SUCCESS),
  deleteEntityByEntityNameError: getErrorAction(DELETE_ENTITY_ERROR),
};
