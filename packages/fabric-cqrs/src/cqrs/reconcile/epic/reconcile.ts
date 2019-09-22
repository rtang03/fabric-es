import { Store } from 'redux';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { action as command } from '../../command/action';
import { action } from '../action';
import { ReconcileAction } from '../types';

export default (action$: Observable<ReconcileAction>) =>
  action$.pipe(
    ofType(action.RECONCILE),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName, reducer }, store }) =>
      from(
        new Promise<any>(resolve => {
          const unsubscribe = store.subscribe(() => {
            const state = store.getState().write;
            const tid = state.tx_id;
            const { type, result } = state;
            if (tx_id === tid && type === command.QUERY_SUCCESS) {
              unsubscribe();
              resolve(
                action.merge({
                  tx_id,
                  args: { entityName, commits: result, reducer },
                  store
                })
              );
            }
          });
          (store as Store).dispatch(
            command.queryByEntityName({ tx_id, args: { entityName } })
          );
        })
      )
    )
  );
