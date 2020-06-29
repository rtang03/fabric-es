/**
 * @packageDocumentation
 * @hidden
 */
import { Wallet } from 'fabric-network';
import assign from 'lodash/assign';
import { AnyAction, Store } from 'redux';

type Action = { type: string; payload?: { tx_id: string; args: any } };

export const getAction: <TAction extends Action>(
  action: string
) => (option: {
  tx_id: string;
  args: TAction['payload']['args'];
  store?: Store;
  enrollmentId?: string;
  channelName?: string;
  connectionProfile?: string;
  wallet?: Wallet;
}) => AnyAction = <TAction extends Action>(action) => ({
  tx_id,
  args,
  store,
  enrollmentId,
  channelName,
  connectionProfile,
  wallet,
}) =>
  assign(
    {},
    {
      type: action,
      payload: {
        tx_id,
        args,
        store,
        enrollmentId,
        channelName,
        connectionProfile,
        wallet,
      },
    }
  );
