import util from 'util';
import { generateToken } from '@fabric-es/fabric-cqrs';
import { Dispatcher } from '../types';

export const dispatcher: Dispatcher = <TResult, TArgs>(actionDispatcher, options, onSuccess) => (
  args: TArgs
) =>
  new Promise<{ data: TResult }>((resolve, reject) => {
    const { name, store, slice, SuccessAction, typeGuard, ErrorAction, logger } = options;
    const tid = generateToken();
    const unsubscribe = store.subscribe(() => {
      const { tx_id, error, type } = store.getState()[slice];
      const result: unknown = store.getState()[slice].result;
      if (tx_id === tid && type === SuccessAction) {
        unsubscribe();

        const data = onSuccess ? onSuccess(result) : result;

        if (typeGuard)
          if (typeGuard(result)) resolve({ data });
          else {
            logger.error(util.format('fail to pass TypeGuard, %s, %j', name, result));
            reject(new Error(`fail to pass TypeGuard: ${name}`));
          }
        else resolve({ data });
      }

      if (tx_id === tid && type === ErrorAction) {
        logger.warn(util.format('name: %s, tx_id: %s, %s', name, tid, ErrorAction));

        unsubscribe();

        reject(new Error(util.format('%s, %j', type, error)));
      }
    });

    store.dispatch(actionDispatcher({ tx_id: tid, args }));

    logger.info(util.format('name: %s, tx_id: %s, %s dispatched', name, tid));
  })
    .then(({ data }) => ({
      status: 'OK',
      data,
    }))
    .catch((e) => ({ status: 'ERROR', data: null, error: e }));
