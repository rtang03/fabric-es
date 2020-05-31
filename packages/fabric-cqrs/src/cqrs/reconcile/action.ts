/**
 * @packageDocumentation
 * @hidden
 */
import { getAction, getErrorAction, getSuccessAction } from '../utils';
import { MergeAction, ReconcileAction } from './types';

const RECONCILE = '[Entity] Reconcile';
const RECONCILE_ERROR = '[Entity] Reconcile Error';
const RECONCILE_SUCCESS = '[Entity] Reconcile Success';
const MERGE = '[Entity] Merge the queried entity to Query-side';

export const action = {
  RECONCILE,
  RECONCILE_ERROR,
  RECONCILE_SUCCESS,
  MERGE,
  reconcile: getAction<ReconcileAction>(RECONCILE),
  merge: getAction<MergeAction>(MERGE),
  reconcileError: getErrorAction(RECONCILE_ERROR),
  reconcileSuccess: getSuccessAction(RECONCILE_SUCCESS)
};
