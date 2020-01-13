import Client from 'fabric-client';
import { Store } from 'redux';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import util from 'util';
import { action as query } from '../../query/action';
import { action } from '../action';
import { MergeAction } from '../types';

export default (action$: Observable<MergeAction>) => {
  const logger = Client.getLogger('merge.js');

  return action$.pipe(
    ofType(action.MERGE),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName, commits, reducer }, store }) =>
      from(
        new Promise(resolve => {
          const unsubscribe = store.subscribe(() => {
            const state = store.getState().query;
            const tid = state.tx_id;
            const { result, type } = state;

            if (tx_id === tid && type === query.MERGE_BATCH_SUCCESS) {
              logger.info(query.MERGE_BATCH_SUCCESS);
              logger.debug(
                util.format(
                  'tx_id: %s, type: %s',
                  tid,
                  query.MERGE_BATCH_SUCCESS
                )
              );

              unsubscribe();

              resolve(action.reconcileSuccess({ tx_id, result }));
            }
          });

          (store as Store).dispatch(
            query.mergeBatch({ tx_id, args: { entityName, commits } })
          );

          logger.info(`dispatch ${query.MERGE_BATCH}: ${tx_id}`);
        })
      )
    )
  );
};
