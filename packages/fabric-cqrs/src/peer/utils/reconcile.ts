/**
 * @packageDocumentation
 * @hidden
 */
import util from 'util';
import { Utils } from 'fabric-common';
import { Wallet } from 'fabric-network';
import { Store } from 'redux';
import { action } from '../../cqrs/reconcile';
import { generateToken } from '../../store/utils';
import { Reducer } from '../../types';

const { RECONCILE_SUCCESS, RECONCILE_ERROR } = action;

export const reconcile: (option: {
  store: Store;
  channelName: string;
  connectionProfile: string;
  wallet: Wallet;
}) => (option: { entityName: string; reducer: Reducer }) => Promise<{ result: any }> = ({
  store,
  channelName,
  connectionProfile,
  wallet
}) => ({ entityName, reducer }) =>
  new Promise<{ result: any }>((resolve, reject) => {
    const logger = Utils.getLogger('[fabric-cqrs] reconcile.js');
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
        channelName,
        connectionProfile,
        wallet
      })
    );

    logger.info(util.format('reconcile, tx_id: %s, %s, %j', tid, entityName, reducer));
  });
