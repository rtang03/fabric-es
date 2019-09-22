import { AnyAction, Store } from 'redux';

type Action = { type: string; payload?: { tx_id: string; args: any } };

export const getAction = <TAction extends Action>(action: string) => ({
  tx_id,
  args,
  store
}: {
  tx_id: string;
  args: TAction['payload']['args'];
  store?: Store;
}): AnyAction => ({
  type: action,
  payload: { tx_id, args, store }
});
