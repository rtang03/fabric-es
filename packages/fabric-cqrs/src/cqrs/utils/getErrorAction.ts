import { AnyAction } from 'redux';

export const getErrorAction: <TError = any>(
  type: string
) => ({ tx_id, error }: { tx_id: string; error: TError }) => AnyAction = type => ({ tx_id, error }) => ({
  type,
  payload: { tx_id, error }
});
