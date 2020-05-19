import {
  ActionHandler,
  getErrorActionHandler,
  getSuccessActionHandler,
  initialState,
  State
} from '@fabric-es/fabric-cqrs';
import { Reducer } from 'redux';
import { getReducer } from '../../utils/getReducer';
import { action } from './action';

const actionHandler: ActionHandler = {
  [action.RECONCILE_SUCCESS]: getSuccessActionHandler(action.RECONCILE_SUCCESS),
  [action.RECONCILE_ERROR]: getErrorActionHandler(action.RECONCILE_ERROR)
};

export const reducer: Reducer<State> = getReducer(initialState, actionHandler);
