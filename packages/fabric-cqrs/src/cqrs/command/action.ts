import { getAction, getErrorAction, getSuccessAction } from '../utils';
import {
  CreateAction,
  DeleteByEntityIdAction,
  DeleteByEntityIdCommitIdAction,
  QueryByEntIdCommitIdAction,
  QueryByEntityIdAction,
  QueryByEntityNameAction
} from './types';

const CREATE = '[Entity-C] Create';
const CREATE_ERROR = '[Entity-C] Create Error';
const CREATE_SUCCESS = '[Entity-C] Create Success';
const DELETE_BY_ENTITYID = '[Entity-C] Delete entities By entityName and id';
const DELETE_ERROR = '[Entity-C] Delete Error';
const DELETE_SUCCESS = '[Entity-C] Delete Success';
const DELETE_BY_ENTITYID_COMMITID =
  '[Entity-C] Delete By entityId and commitId';
const QUERY_BY_ENTITY_ID = '[Entity-C] Query entity by entity id';
const QUERY_BY_ENTITY_NAME = '[Entity-C] Query entity by entityName';
const QUERY_BY_ENTITYID_COMMITID = '[Entity-C] Query by entity id and commitId';
const QUERY_ERROR = '[Entity-C] Query Error';
const QUERY_SUCCESS = '[Entity-C] Query Success';

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
  deleteByEntityIdCommitId: getAction<DeleteByEntityIdCommitIdAction>(
    DELETE_BY_ENTITYID_COMMITID
  ),
  queryByEntityId: getAction<QueryByEntityIdAction>(QUERY_BY_ENTITY_ID),
  queryByEntityName: getAction<QueryByEntityNameAction>(QUERY_BY_ENTITY_NAME),
  queryByEntIdCommitId: getAction<QueryByEntIdCommitIdAction>(
    QUERY_BY_ENTITYID_COMMITID
  ),
  createError: getErrorAction(CREATE_ERROR),
  createSuccess: getSuccessAction(CREATE_SUCCESS),
  deleteError: getErrorAction(DELETE_ERROR),
  deleteSuccess: getSuccessAction(DELETE_SUCCESS),
  queryError: getErrorAction(QUERY_ERROR),
  querySuccess: getSuccessAction(QUERY_SUCCESS)
};
