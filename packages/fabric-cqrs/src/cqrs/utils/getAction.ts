import { Wallet } from 'fabric-network';
import { AnyAction, Store } from 'redux';

type Action = { type: string; payload?: { tx_id: string; args: any } };

export const getAction: <TAction extends Action>(
  action: string
) => (option: {
  tx_id: string;
  args: TAction['payload']['args'];
  store?: Store;
  enrollmentId?: string;
  channelEventHub?: string;
  channelName?: string;
  connectionProfile?: string;
  wallet?: Wallet;
}) => AnyAction = <TAction extends Action>(action) => ({
  tx_id,
  args,
  store,
  enrollmentId,
  channelEventHub,
  channelName,
  connectionProfile,
  wallet
}) => ({
  type: action,
  payload: {
    tx_id,
    args,
    store,
    enrollmentId,
    channelName,
    channelEventHub,
    connectionProfile,
    wallet
  }
});
