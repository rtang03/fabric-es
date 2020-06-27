/**
 * @packageDocumentation
 * @hidden
 */
import assign from 'lodash/assign';
import type { State } from '../../types';

export const getSuccessActionHandler: <TResult = any>(
  type: string
) => (
  state: State,
  {
    payload: { tx_id: string, result: TResult },
  }
) => State = (type) => (state, { payload: { tx_id, result } }) => ({
  tx_id,
  type,
  result,
  error: null,
});

export const getErrorActionHandler: <TError = any>(
  type: string
) => (
  state: State,
  {
    payload: { tx_id: string, error: TError },
  }
) => State = (type) => (state, { payload: { tx_id, error } }) =>
  assign(
    {},
    {
      tx_id,
      type,
      result: null,
      error,
    }
  );
