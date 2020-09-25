import util from 'util';
import { generateToken } from '../store/utils';
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
          if (result === null) {
            logger.debug(util.format('actionName %s, tx_id: %s resolved', name, tx_id));
            resolve({ data: null });
          } else if (typeGuard(result)) {
            logger.debug(util.format('actionName %s, tx_id: %s resolved', name, tx_id));
            resolve({ data });
          } else {
            logger.error(util.format('fail to pass TypeGuard, %s, %j', name, result));
            reject(`fail to pass TypeGuard: ${name}`);
          }
        else {
          logger.debug(util.format('actionName %s, tx_id: %s resolved', name, tx_id));
          resolve({ data });
        }
      }

      if (tx_id === tid && type === ErrorAction) {
        logger.warn(
          util.format(
            '[dispatcher] ErrorAction: [%s], tx_id: %s, %s, %j',
            name,
            tid,
            ErrorAction,
            error
          )
        );

        unsubscribe();

        reject(new Error(util.format('%s, %j', type, error)));
      }
    });

    store.dispatch(actionDispatcher({ tx_id: tid, args }));

    logger.debug(util.format('[dispatcher] actionName: %s, tx_id: %s dispatched', name, tid));
  })
    .then(({ data }) => ({
      status: 'OK',
      data,
    }))
    .catch((e) => ({ status: 'ERROR', data: null, error: e }));
