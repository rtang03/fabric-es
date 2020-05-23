import { Commit } from '@fabric-es/fabric-cqrs';
import { Utils } from 'fabric-common';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { dispatcher } from '../../../utils';
import { action as query } from '../../query/action';
import { action } from '../action';
import { MergeAction } from '../types';

export default (action$: Observable<MergeAction>) =>
  action$.pipe(
    ofType(action.MERGE),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { entityName, commits, reducer }, store }) =>
      from(
        dispatcher<any, { entityName: string; commits: Record<string, Commit> }>(
          (payload) => query.mergeBatch(payload),
          {
            SuccessAction: query.MERGE_BATCH_SUCCESS,
            ErrorAction: query.MERGE_BATCH_ERROR,
            logger: Utils.getLogger('[query-handler] merge.js'),
            name: 'merge',
            slice: 'query',
            store,
          }
        )({ entityName, commits }).then(({ data }) => action.reconcileSuccess({ tx_id, result: data }))
      )
    )
  );
