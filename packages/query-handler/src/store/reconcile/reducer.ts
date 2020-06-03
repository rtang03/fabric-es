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
  RECONCILE_ERROR,
  RECONCILE_SUCCESS,
  MERGE_COMMIT_BATCH_ERROR,
  MERGE_COMMIT_BATCH_SUCCESS,
  MERGE_ENTITY_BATCH_ERROR,
  MERGE_ENTITY_BATCH_SUCCESS,
} = action;

const actionHandler: ActionHandler = {
  [RECONCILE_SUCCESS]: getSuccessActionHandler(RECONCILE_SUCCESS),
  [MERGE_COMMIT_BATCH_SUCCESS]: getSuccessActionHandler(MERGE_COMMIT_BATCH_SUCCESS),
  [MERGE_ENTITY_BATCH_SUCCESS]: getSuccessActionHandler(MERGE_ENTITY_BATCH_SUCCESS),
  [RECONCILE_ERROR]: getErrorActionHandler(RECONCILE_ERROR),
  [MERGE_COMMIT_BATCH_ERROR]: getErrorActionHandler(MERGE_COMMIT_BATCH_ERROR),
  [MERGE_ENTITY_BATCH_ERROR]: getErrorActionHandler(MERGE_ENTITY_BATCH_ERROR),
};

export const reducer: Reducer<State> = getReducer(initialState, actionHandler);
