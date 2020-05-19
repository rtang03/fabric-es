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
  [action.UPSERT_MANY_SUCCESS]: getSuccessActionHandler(action.UPSERT_MANY_SUCCESS),
  [action.UPSERT_SUCCESS]: getSuccessActionHandler(action.UPSERT_SUCCESS),
  [action.FIND_SUCCESS]: getSuccessActionHandler(action.FIND_SUCCESS)
};

export const reducer: Reducer<State> = getReducer(initialState, actionHandler);
