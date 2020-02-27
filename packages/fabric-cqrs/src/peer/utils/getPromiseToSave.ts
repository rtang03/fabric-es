import util from 'util';
import Client from 'fabric-client';
import { Wallet } from 'fabric-network';
import { values } from 'lodash';
import { Store } from 'redux';
import { action as writeAction } from '../../cqrs/command';
import { generateToken } from '../../cqrs/utils';
import { Commit } from '../../types';

export const getPromiseToSave: (option: {
  entityName: string;
  id: string;
  events: any[];
  version: number;
  store: Store;
  collection?: string;
  enrollmentId?: string;
  channelEventHub: string;
  channelName: string;
  connectionProfile: string;
  wallet: Wallet;
}) => Promise<Commit> = ({
  entityName,
  id,
  events,
  version,
  store,
  collection,
  enrollmentId,
  channelEventHub,
  channelName,
  connectionProfile,
  wallet
}) => {
  const logger = Client.getLogger('getPromiseToSave.js');

  return new Promise((resolve, reject) => {
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, type, result, error } = store.getState().write;
      if (tx_id === tid && type === writeAction.CREATE_SUCCESS) {
        logger.info(util.format('type: %s, tx_id: %s', writeAction.CREATE_SUCCESS, tid));

        unsubscribe();
        resolve(values(result)[0] as Commit);
      }
      if (tx_id === tid && type === writeAction.CREATE_ERROR) {
        logger.info(util.format('type: %s, tx_id: %s', writeAction.CREATE_ERROR, tid));

        unsubscribe();
        reject({ error });
      }
    });
    store.dispatch(
      writeAction.create({
        channelEventHub,
        channelName,
        connectionProfile,
        wallet,
        tx_id: tid,
        args: { entityName, id, version, events, collection },
        enrollmentId
      }) as any
    );
    logger.info(`dispatch ${writeAction.CREATE}, tx_id: ${tid}`);
  });
};
