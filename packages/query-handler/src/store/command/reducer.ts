import {
  ActionHandler,
  initialState,
  State,
  getErrorActionHandler,
  getSuccessActionHandler
} from '@fabric-es/fabric-cqrs';
import { Reducer } from 'redux';
import { getReducer } from '../../utils/getReducer';
import { action } from './action';

const actionHandler: ActionHandler = {
  [action.CREATE_SUCCESS]: getSuccessActionHandler(action.CREATE_SUCCESS),
  [action.CREATE_ERROR]: getErrorActionHandler(action.CREATE_ERROR),
  [action.DELETE_SUCCESS]: getSuccessActionHandler(action.DELETE_SUCCESS),
  [action.DELETE_ERROR]: getErrorActionHandler(action.DELETE_ERROR),
  [action.QUERY_SUCCESS]: getSuccessActionHandler(action.QUERY_SUCCESS),
  [action.QUERY_ERROR]: getErrorActionHandler(action.QUERY_ERROR)
};

export const reducer: Reducer<State> = getReducer(initialState, actionHandler);
