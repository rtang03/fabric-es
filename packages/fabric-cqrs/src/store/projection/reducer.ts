import { Reducer } from 'redux';
import { ActionHandler, initialState, State } from '../../types';
import { getErrorActionHandler, getReducer, getSuccessActionHandler } from '../utils';
import { action } from './action';

const {
  MERGE_ENTITY_SUCCESS,
  MERGE_ENTITY_ERROR,
  MERGE_ENTITY_BATCH_SUCCESS,
  MERGE_ENTITY_BATCH_ERROR,
} = action;

const actionHandler: ActionHandler = {
  [MERGE_ENTITY_SUCCESS]: getSuccessActionHandler(MERGE_ENTITY_SUCCESS),
  [MERGE_ENTITY_ERROR]: getErrorActionHandler(MERGE_ENTITY_ERROR),
  [MERGE_ENTITY_BATCH_SUCCESS]: getSuccessActionHandler(MERGE_ENTITY_BATCH_SUCCESS),
  [MERGE_ENTITY_BATCH_ERROR]: getErrorActionHandler(MERGE_ENTITY_BATCH_ERROR),
};

export const reducer: Reducer<State> = getReducer(initialState, actionHandler);
