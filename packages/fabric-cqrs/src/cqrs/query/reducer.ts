import { Reducer } from 'redux';
import { ActionHandler, initialState, State } from '../../types';
import { getErrorActionHandler, getReducer, getSuccessActionHandler } from '../utils';
import { action } from './action';

const actionHandler: ActionHandler = {
  [action.MERGE_SUCCESS]: getSuccessActionHandler(action.MERGE_SUCCESS),
  [action.MERGE_ERROR]: getErrorActionHandler(action.MERGE_ERROR),
  [action.MERGE_BATCH_SUCCESS]: getSuccessActionHandler(action.MERGE_BATCH_SUCCESS),
  [action.MERGE_BATCH_ERROR]: getErrorActionHandler(action.MERGE_BATCH_ERROR),
  [action.DELETE_SUCCESS]: getSuccessActionHandler(action.DELETE_SUCCESS),
  [action.DELETE_ERROR]: getErrorActionHandler(action.DELETE_ERROR),
  [action.QUERY_SUCCESS]: getSuccessActionHandler(action.QUERY_SUCCESS),
  [action.QUERY_ERROR]: getErrorActionHandler(action.QUERY_ERROR)
};

export const reducer: Reducer<State> = getReducer(initialState, actionHandler);
