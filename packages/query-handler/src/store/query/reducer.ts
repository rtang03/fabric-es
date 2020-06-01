import {
  ActionHandler,
  getErrorActionHandler,
  getSuccessActionHandler,
  initialState,
  State,
} from '@fabric-es/fabric-cqrs';
import { Reducer } from 'redux';
import { getReducer } from '../../utils/getReducer';
import { action } from './action';

const {
  MERGE_COMMIT_SUCCESS,
  MERGE_COMMIT_ERROR,
  MERGE_COMMIT_BATCH_ERROR,
  MERGE_COMMIT_BATCH_SUCCESS,
  DELETE_ERROR,
  DELETE_SUCCESS,
  QUERY_ERROR,
  QUERY_SUCCESS,
} = action;

const actionHandler: ActionHandler = {
  [MERGE_COMMIT_SUCCESS]: getSuccessActionHandler(MERGE_COMMIT_SUCCESS),
  [MERGE_COMMIT_ERROR]: getErrorActionHandler(MERGE_COMMIT_ERROR),
  [MERGE_COMMIT_BATCH_SUCCESS]: getSuccessActionHandler(MERGE_COMMIT_BATCH_SUCCESS),
  [MERGE_COMMIT_BATCH_ERROR]: getErrorActionHandler(MERGE_COMMIT_BATCH_ERROR),
  [DELETE_SUCCESS]: getSuccessActionHandler(DELETE_SUCCESS),
  [DELETE_ERROR]: getErrorActionHandler(DELETE_ERROR),
  [QUERY_SUCCESS]: getSuccessActionHandler(QUERY_SUCCESS),
  [QUERY_ERROR]: getErrorActionHandler(QUERY_ERROR),
};

export const reducer: Reducer<State> = getReducer(initialState, actionHandler);
