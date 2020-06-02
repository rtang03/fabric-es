/**
 * @packageDocumentation
 * @hidden
 */
import util from 'util';
import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import evaluate$ from '../../../services/evaluate';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import type { QueryByEntityNameAction } from '../types';

const { QUERY_BY_ENTITY_NAME, querySuccess, queryError } = action;

export default (action$: Observable<QueryByEntityNameAction>, _, context) =>
  action$.pipe(
    ofType(QUERY_BY_ENTITY_NAME),
    mergeMap(({ payload: { tx_id, args: { entityName, isPrivateData } } }) =>
      isPrivateData
        ? evaluate$('privatedata:queryByEntityName', [entityName], context, true).pipe(
            tap((commits) =>
              context.logger.debug(
                util.format(
                  '[store/command/queryByEntityName.js] dispatch evaluate response: %j',
                  commits
                )
              )
            ),
            dispatchResult(tx_id, querySuccess, queryError)
          )
        : evaluate$('eventstore:queryByEntityName', [entityName], context, false).pipe(
            tap((commits) =>
              context.logger.debug(
                util.format(
                  '[store/command/queryByEntityName.js] dispatch evaluate response: %j',
                  commits
                )
              )
            ),
            dispatchResult(tx_id, querySuccess, queryError)
          )
    )
  );
