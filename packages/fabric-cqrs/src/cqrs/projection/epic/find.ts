import Client from 'fabric-client';
import { ofType } from 'redux-observable';
import { from, Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ProjectionDb } from '../../../types';
import { action } from '../action';
import { FindAction } from '../types';

export default (action$: Observable<FindAction>, _, context: { projectionDb: ProjectionDb }) => {
  const logger = Client.getLogger('find.js');

  return action$.pipe(
    ofType(action.FIND),
    map(({ payload }) => payload),
    mergeMap(({ tx_id, args: { all, contain, where } }) =>
      from(
        context.projectionDb.find({ all, contain, where }).then(({ data }) => {
          logger.info('projectionDb find successful');

          return action.findSuccess({ tx_id, result: data });
        })
      )
    )
  );
};
