/**
 * @packageDocumentation
 * @hidden
 */
import assign from 'lodash/assign';
import { AnyAction } from 'redux';

export const getSuccessAction: <TResult = any>(
  type: string
) => ({ tx_id, result, args }: { tx_id: string; result: TResult; args?: any }) => AnyAction = (
  type
) => ({ tx_id, result, args }) =>
  assign(
    {},
    {
      type,
      payload: { tx_id, result, args },
    }
  );
