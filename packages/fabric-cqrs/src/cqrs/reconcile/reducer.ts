import { Reducer } from 'redux';
import { ActionHandler, initialState, State } from '../../types';
import {
  getErrorActionHandler,
  getReducer,
  getSuccessActionHandler
} from '../utils';
import { action } from './action';

const actionHandler: ActionHandler = {
  [action.RECONCILE_SUCCESS]: getSuccessActionHandler(action.RECONCILE_SUCCESS),
  [action.RECONCILE_ERROR]: getErrorActionHandler(action.RECONCILE_ERROR)
};

export const reducer: Reducer<State> = getReducer(initialState, actionHandler);
