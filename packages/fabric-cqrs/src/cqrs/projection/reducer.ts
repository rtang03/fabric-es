/**
 * @packageDocumentation
 * @hidden
 */
import { Reducer } from 'redux';
import { ActionHandler, initialState, State } from '../../types';
import { getErrorActionHandler, getReducer, getSuccessActionHandler } from '../../store/utils';
import { action } from './action';

const actionHandler: ActionHandler = {
  [action.UPSERT_MANY_SUCCESS]: getSuccessActionHandler(action.UPSERT_MANY_SUCCESS),
  [action.UPSERT_SUCCESS]: getSuccessActionHandler(action.UPSERT_SUCCESS),
  [action.FIND_SUCCESS]: getSuccessActionHandler(action.FIND_SUCCESS)
};

export const reducer: Reducer<State> = getReducer(initialState, actionHandler);
