import util from 'util';
import { generateToken } from '@fabric-es/fabric-cqrs';
import { Dispatcher } from '../types';

export const dispatcher: Dispatcher = <TResult, TArgs>(actionDispatcher, options, onSuccess) => (args) =>
  new Promise<{ data: TResult }>((resolve, reject) => {
    const { name, store, slice, SuccessAction, ErrorAction, logger } = options;
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, result, error, type } = store.getState()[slice];
      if (tx_id === tid && type === SuccessAction) {
        logger.info(util.format('name: %s, tx_id: %s, %s', name, tid, SuccessAction));
        unsubscribe();
        resolve({ data: onSuccess ? onSuccess(result) : result });
      }

      if (tx_id === tid && type === ErrorAction) {
        logger.warn(util.format('name: %s, tx_id: %s, %s', name, tid, ErrorAction));
        unsubscribe();
        reject({ error });
      }
    });

    store.dispatch(actionDispatcher({ tx_id: tid, args }));

    logger.info(util.format('name: %s, tx_id: %s, %s', name, tid));
  });
