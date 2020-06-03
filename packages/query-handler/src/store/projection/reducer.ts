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
  [action.MERGE_ENTITY_SUCCESS]: getSuccessActionHandler(action.MERGE_ENTITY_SUCCESS),
  [action.MERGE_ENTITY_ERROR]: getErrorActionHandler(action.MERGE_ENTITY_ERROR),
  [action.MERGE_ENTITY_BATCH_SUCCESS]: getSuccessActionHandler(action.MERGE_ENTITY_BATCH_SUCCESS),
  [action.MERGE_ENTITY_BATCH_ERROR]: getErrorActionHandler(action.MERGE_ENTITY_BATCH_ERROR)
};

export const reducer: Reducer<State> = getReducer(initialState, actionHandler);
