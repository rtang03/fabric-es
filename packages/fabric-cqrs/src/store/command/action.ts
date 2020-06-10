/**
 * @packageDocumentation
 * @hidden
 */
import { getAction, getErrorAction, getSuccessAction } from '../utils';
import type {
  CreateAction,
  DeleteByEntityIdAction,
  DeleteByEntityIdCommitIdAction,
  QueryByEntIdCommitIdAction,
  QueryByEntityIdAction,
  QueryByEntityNameAction,
} from './types';

const CREATE = '[Command] Create';
const CREATE_ERROR = '[Command] Create Error';
const CREATE_SUCCESS = '[Command] Create Success';
const DELETE_BY_ENTITYID = '[Command] Delete entities By entityName and id';
const DELETE_ERROR = '[Command] Delete Error';
const DELETE_SUCCESS = '[Command] Delete Success';
const DELETE_BY_ENTITYID_COMMITID = '[Command] Delete By entityId and commitId';
const QUERY_BY_ENTITY_ID = '[Command] Query entity by entity id';
const QUERY_BY_ENTITY_NAME = '[Command] Query entity by entityName';
const QUERY_BY_ENTITYID_COMMITID = '[Command] Query by entity id and commitId';
const QUERY_ERROR = '[Command] Query Error';
const QUERY_SUCCESS = '[Command] Query Success';

export const action = {
  CREATE,
  CREATE_ERROR,
  CREATE_SUCCESS,
  DELETE_BY_ENTITYID,
  DELETE_ERROR,
  DELETE_SUCCESS,
  DELETE_BY_ENTITYID_COMMITID,
  QUERY_BY_ENTITY_ID,
  QUERY_BY_ENTITY_NAME,
  QUERY_BY_ENTITYID_COMMITID,
  QUERY_ERROR,
  QUERY_SUCCESS,
  create: getAction<CreateAction>(CREATE),
  deleteByEntityId: getAction<DeleteByEntityIdAction>(DELETE_BY_ENTITYID),
  deleteByEntityIdCommitId: getAction<DeleteByEntityIdCommitIdAction>(DELETE_BY_ENTITYID_COMMITID),
  queryByEntityId: getAction<QueryByEntityIdAction>(QUERY_BY_ENTITY_ID),
  queryByEntityName: getAction<QueryByEntityNameAction>(QUERY_BY_ENTITY_NAME),
  queryByEntIdCommitId: getAction<QueryByEntIdCommitIdAction>(QUERY_BY_ENTITYID_COMMITID),
  createError: getErrorAction(CREATE_ERROR),
  createSuccess: getSuccessAction(CREATE_SUCCESS),
  deleteError: getErrorAction(DELETE_ERROR),
  deleteSuccess: getSuccessAction(DELETE_SUCCESS),
  queryError: getErrorAction(QUERY_ERROR),
  querySuccess: getSuccessAction(QUERY_SUCCESS),
};
