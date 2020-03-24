/**
 * @packageDocumentation
 * @hidden
 */
import util from 'util';
import Client from 'fabric-client';
import { Wallet } from 'fabric-network';
import { Store } from 'redux';
import { action } from '../../cqrs/reconcile';
import { generateToken } from '../../cqrs/utils';
import { Reducer } from '../../types';

const { RECONCILE_SUCCESS, RECONCILE_ERROR } = action;

export const reconcile: (option: {
  store: Store;
  channelEventHub: string;
  channelName: string;
  connectionProfile: string;
  wallet: Wallet;
}) => (option: { entityName: string; reducer: Reducer }) => Promise<{ result: any }> = ({
  store,
  channelEventHub,
  channelName,
  connectionProfile,
  wallet
}) => ({ entityName, reducer }) => {
  const logger = Client.getLogger('reconcile.js');

  return new Promise<{ result: any }>((resolve, reject) => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, error, type } = store.getState().reconcile;
      if (tx_id === tid && type === RECONCILE_SUCCESS) {
        logger.info(util.format('reconcile, tx_id: %s, %s', tid, RECONCILE_SUCCESS));

        unsubscribe();
        resolve({ result });
      }

      if (tx_id === tid && type === RECONCILE_ERROR) {
        logger.warn(util.format('reconcile, tx_id: %s, %s, %j', tid, RECONCILE_ERROR, error));
        unsubscribe();
        reject({ error });
      }
    });

    store.dispatch(
      action.reconcile({
        tx_id: tid,
        args: { entityName, reducer },
        store,
        channelEventHub,
        channelName,
        connectionProfile,
        wallet
      })
    );

    logger.info(util.format('reconcile, tx_id: %s, %s, %j', tid, entityName, reducer));
  });
};
