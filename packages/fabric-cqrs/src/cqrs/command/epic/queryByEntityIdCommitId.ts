import util from 'util';
import Client from 'fabric-client';
import { ofType } from 'redux-observable';
import { Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import evaluate$ from '../../../services/evaluate';
import { dispatchResult } from '../../utils';
import { action } from '../action';
import { QueryByEntIdCommitIdAction } from '../types';

export default (action$: Observable<QueryByEntIdCommitIdAction>, _, context) => {
  const logger = Client.getLogger('queryByEntityIdCommitId.js');

  return action$.pipe(
    ofType(action.QUERY_BY_ENTITYID_COMMITID),
    mergeMap(({ payload: { tx_id, args: { id, entityName, commitId, collection } } }) =>
      collection
        ? evaluate$('privatedata:queryByEntityIdCommitId', [collection, entityName, id, commitId], context, true).pipe(
            tap(commits => logger.debug(util.format('dispatch evaluate response: %j', commits))),
            dispatchResult(tx_id, action.querySuccess, action.queryError)
          )
        : evaluate$('queryByEntityIdCommitId', [entityName, id, commitId], context).pipe(
            tap(commits => logger.debug(util.format('dispatch evaluate response: %j', commits))),
            dispatchResult(tx_id, action.querySuccess, action.queryError)
          )
    )
  );
};
