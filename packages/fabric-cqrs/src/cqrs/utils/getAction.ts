import { AnyAction, Store } from 'redux';

type Action = { type: string; payload?: { tx_id: string; args: any } };

export const getAction: <TAction extends Action>(
  action: string
) => (option: {
  tx_id: string;
  args: TAction['payload']['args'];
  store?: Store;
  enrollmentId?: string;
}) => AnyAction = <TAction extends Action>(action) => ({
  tx_id,
  args,
  store,
  enrollmentId
}) => ({
  type: action,
  payload: { tx_id, args, store, enrollmentId }
});
