import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { submit$, submitPrivateData$ } from '../../../services';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import { CreateAction } from '../types';

export default (action$: Observable<CreateAction>, _, context) =>
  action$.pipe(
    ofType(action.CREATE),
    map(({ payload }) => payload),
    mergeMap(
      ({ tx_id, args: { id, entityName, events, version, collection } }) =>
        collection
          ? submitPrivateData$(
              'privatedata:createCommit',
              [collection, entityName, id, version.toString()],
              { eventstr: Buffer.from(JSON.stringify(events)) },
              context
            ).pipe(
              dispatchResult(tx_id, action.createSuccess, action.createError)
            )
          : submit$(
              'createCommit',
              [entityName, id, version.toString(), JSON.stringify(events)],
              context
            ).pipe(
              dispatchResult(tx_id, action.createSuccess, action.createError)
            )
    )
  );
